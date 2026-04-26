import { flatParts, indexDirs } from "./contents.js";
import { formatArticleText } from "./general.js";

const ratification_data = await fetch('/static/data/ratification.json').then(r => r.json());

// Set up amendment selection

const $select = $("#amendment");
for (let a = 1; a <= 106; a++) {
    let $option = $(`<option value="${a}">${a}</option>`);
    $option.appendTo($select);
}

$select.on('change', () => {
    updatedSelectedAmendment($("#amendment").val());
});



// Switch amendment

var $articles_box = $('#articles');

async function updatedSelectedAmendment(selected_version) {
    $articles_box.empty();

    $('.stats').each(function () { $(this).hide(); });

    const progress = { articles_completed: 0 };
    var total_articles = 0;
    var stats = {
        words_added: 0,
        words_deleted: 0,
        articles_added: 0,
        articles_deleted: 0
    };

    const progressProxy = new Proxy(progress, {
        set(target, property, value) {
            target[property] = value;
            if (value === total_articles && total_articles !== 0) {
                updateStats(stats);
            }
            return true;
        }
    });

    function makeArticle(dir) {
        var path = `${dir}version/a${selected_version}.html`;

        var $article_box = $('<div class="art-holder"></div>');

        var $jump_to = $('<a>Jump to</a>');
        $jump_to.attr('href', dir);
        $jump_to.appendTo($article_box);

        var $container = $('<div></div>');
        $container.load(path, (_, status, xhr) => {

            if (status === 'error' && xhr.status === 404) {
                progressProxy.articles_completed += 1;
                return;
            }

            const $toggleButton = $container.find("#toggleButton");
            if ($toggleButton.length) {
                $toggleButton.hide();
            }
            $container.find('script').attr('type', 'module');
            $container.appendTo($article_box);
            $article_box.appendTo($articles_box);
            formatArticleText($container);
            document.dispatchEvent(new Event('markChanges'));

            // Stats

            function hasBeenEntirely(obj, s) {
                return obj.clone().find(s).remove().end().html().trim().length === 0;
            }

            $container.find('ins, .ins').each(function () {
                if ($(this).text().trim().length) { 
                    stats.words_added += $(this).text().match(/\S+/gm).length;
                }
            });

            $container.find('del, .del').each(function () {
                if ($(this).text().trim().length) { 
                    stats.words_deleted += $(this).text().match(/\S+/gm).length;
                }
            });

            $container.find('li.renum').each(function () {
                // For new/old numbers

                if (hasBeenEntirely($(this), 'ins, .ins')) {
                    stats.words_added += 1;

                } else if (hasBeenEntirely($(this), 'del, .del, i:contains("Omitted")')) {
                    stats.words_deleted += 1;

                } else {
                    stats.words_added += 1;
                    stats.words_deleted += 1;
                }
            });

            if (!dir.includes('Schedules')) {
                const $margin = $container.find('.art');

                if (hasBeenEntirely($margin, 'ins, .ins')) {
                    stats.articles_added += 1;
                }

                if (hasBeenEntirely($margin, 'del, .del')) {
                    stats.articles_deleted += 1;
                }
            }

            progressProxy.articles_completed += 1;
        });

    }

    let flat;
    try {
        flat = await flatParts();
    } catch (buildFailed) {
        $articles_box.replaceWith(buildFailed);
        return;
    }

    if (ratification_data[selected_version] && !ratification_data[selected_version].disabled) {
        setMap(selected_version);
        $('#open-map').show();
    } else {
        $('#open-map').hide();
        $('#map').hide();
    }

    flat.map((part) => {
        let dir = part.dir;
        indexDirs(`Failed to index ${dir}`, (dir = dir)).then((articles) => {
            total_articles += articles.length;
            articles.map((article) => makeArticle(dir + article));
        });
    });
}



// Ratifying states map

import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

const external = '#eee';
const not_state = '#ddd';
const not_ratified = '#969696';
const ratified = '#080';
const unclear = not_state;

const color_key = {
    'external': external,
    'not a state': not_state,
    'not ratified': not_ratified,
    'ratified': ratified,
    'unclear': unclear
}

async function drawIndiaMap(mapUrl, data) {

    const width = $('svg').width();
    const height = $('svg').height();

    const topology = await fetch(mapUrl).then(r => r.json());

    const states = topojson.feature(topology, topology.objects.states);
    const borders = topojson.mesh(topology, topology.objects.states, (a, b) => a !== b);

    const svg = d3.select('svg');
    const projection = d3.geoMercator().fitSize([width, height], states);
    const path = d3.geoPath(projection);

    const state_names = states.features.map(d => d.properties.id);
    const states_not_found = Object.entries(data).map(([k, v]) => k).filter(item => !state_names.includes(item));
    if (states_not_found.length) {
        console.warn(`These states have no geography: ${states_not_found.join(';')}`);
    }

    function selectFill(d) {
        if (data[d.properties.id]) {
            const value = data[d.properties.id];
            return color_key[value] ? color_key[value] : unclear;
        }
        console.warn(`${d.properties.id} doesn't have data.`);
        return unclear;
    }

    svg.selectAll('path.state')
        .data(states.features, d => d.properties.id)
        .join('path')
        .attr('name', d => d.properties.id)
        .attr('class', 'state')
        .attr('d', path)
        .attr('fill', selectFill);

    svg.selectAll('path.borders')
        .data([borders])
        .join('path')
        .attr('class', 'borders')
        .attr('d', path)
        .attr('fill', 'none')
        .attr('stroke', 'black');
}

$('#open-map').on('click', () => {
    $('#map').show();
});

$('#close-map').on('click', () => {
    $('#map').hide();
});

function setMap(amendment) {
    const path = `/static/data/gis/${ratification_data[amendment].id}.json`;

    drawIndiaMap(path, ratification_data[amendment].states);
}


// Update words/articles added/deleted

function updateStats(stats) {
    $('#words-added').html(stats.words_added.toLocaleString());
    $('#words-deleted').html(stats.words_deleted.toLocaleString());
    $('#articles-added').html(stats.articles_added.toLocaleString());
    $('#articles-deleted').html(stats.articles_deleted.toLocaleString());

    $('.stats').each(function () { $(this).show(); });
}