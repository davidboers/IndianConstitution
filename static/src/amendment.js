import { flatParts, indexDirs } from "./contents.js";

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

    function makeArticle(dir) {
        var path = `${dir}version/a${selected_version}.html`;

        var $article_box = $('<div class="art-holder"></div>');

        var $jump_to = $('<a>Jump to</a>');
        $jump_to.attr('href', dir);
        $jump_to.appendTo($article_box);

        var $container = $('<div></div>');
        $container.load(path, (_, status, xhr) => {
            if (status === 'error' && xhr.status === 404) {
                return;
            }

            const $toggleButton = $container.find("#toggleButton");
            if ($toggleButton.length) {
                $toggleButton.css('display', 'none');
            }
            $container.find('script').attr('type', 'module');
            $container.appendTo($article_box);
            $article_box.appendTo($articles_box);
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
        indexDirs(`Failed to index ${dir}`, (dir = dir)).then((articles) =>
            articles.map((article) => makeArticle(dir + article))
        );
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
// setMap('101');