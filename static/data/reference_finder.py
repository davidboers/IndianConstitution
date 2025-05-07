import os
import json
import re

def find_references(html):
    refs = re.findall(r'article [0-9A-Z]+', html, flags = re.IGNORECASE)

    group_refs = re.findall(r'articles [0-9A-Z]+ and [0-9A-Z]+', html, re.IGNORECASE) + \
                 re.findall(r'articles [0-9A-Z]+, [0-9A-Z]+ and [0-9A-Z]+', html, re.IGNORECASE) + \
                 re.findall(r'articles [0-9A-Z]+, [0-9A-Z]+, [0-9A-Z]+ and [0-9A-Z]+', html, re.IGNORECASE) + \
                 re.findall(r'articles [0-9A-Z]+, [0-9A-Z]+, [0-9A-Z]+, [0-9A-Z]+ and [0-9A-Z]+', html, re.IGNORECASE)

    for ref in group_refs:
        numbers = re.findall(r'[0-9A-Z]+', ref, re.IGNORECASE)
        for number in numbers:
            refs.append('article ' + number)

    return refs

def reference_finder(path):
    pairs = []
    reference_links = {}

    for root, dirs, files in os.walk(path):
        for file in files:
            if 'version' in root:
                fullpath = os.path.join(root, file)
                artpath = root.split('version')[0].split('en/')[1].replace('\\', '/')
                with open(fullpath, 'r', encoding = 'utf-8') as versionfile:
                    html = versionfile.read()

                    title = html.split('<title>')[1].split(' — Constitution of India</title>')[0].lower()
                    print(title)
                    name = html.split('<p class="art">')[1].split('</p>')[0].replace('—', '')
                    reference_links[title] = {
                        "name": name,
                        "path": artpath
                    }

                    references = find_references(html)
                    for reference in references:
                        reference = reference.lower()
                        if title == reference:
                            continue
                        if (reference, title) not in pairs and (title, reference) not in pairs:
                            pairs.append((title, reference))

    cross_references = [
        [
            reference_links[a],
            reference_links[b]
        ]
        for (a, b) in pairs
        if a in reference_links and b in reference_links
    ]

    extern = json.load(open('static/data/external-references.json', 'r'))

    cross_references = cross_references + extern
    json.dump(cross_references, open('static/data/cross-reference.json', 'w'))

reference_finder('en/')