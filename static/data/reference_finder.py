import os
import json
import re

FULL_SCHEDULES = r'(?:First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth|Eleventh|Twelfth)+ Schedule'

def find_references(html):
    refs = re.findall(r'article [0-9]+[A-Z]*', html, flags = re.IGNORECASE)

    # Group article references

    group_refs = re.findall(r'articles [0-9]+[A-Z]*(?:, [0-9]+[A-Z]*)* and [0-9]+[A-Z]*', html, re.IGNORECASE) + \
                 re.findall(r'articles [0-9]+[A-Z]*, [0-9]+[A-Z]*, [0-9]+[A-Z]*, [0-9]+[A-Z]* and (?:article )[0-9]+[A-Z]*', html, re.IGNORECASE) # Article 366(26B) seems to be unique

    for ref in group_refs:
        numbers = re.findall(r'[0-9]+[A-Z]*', ref, re.IGNORECASE)
        for number in numbers:
            refs.append('article ' + number)

    # Schedule references

    sch_refs = re.findall(FULL_SCHEDULES, html, re.IGNORECASE)
    refs.extend(sch_refs)

    return refs

def extract_title(html, fullpath):
    title = re.search(r'<title>([a-z0-9\s]+) — Constitution of India</title>', html, re.IGNORECASE)

    if title is None:
        print(f'Warning: {fullpath} has no title.')
        return 'Untitled'
    
    title = title.group(1)

    # Generalize titles of Schedules other than the pre-1956 First Schedule

    if 'Schedule' in title:
        schedule_ref = re.search(FULL_SCHEDULES, title, re.IGNORECASE)

        if schedule_ref is not None:
            title = schedule_ref.group(0)

    return title

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

                    title = extract_title(html, fullpath)
                   
                    if re.search(r'Schedule', title, re.IGNORECASE):
                        artpath = f'Schedules/{title.replace(" ", "_")}/contents.html'

                    this_ref_id = title.lower()
                    reference_links[this_ref_id] = {
                        "name": title,
                        "path": artpath
                    }

                    references = find_references(html)
                    for reference in references:
                        reference = reference.lower()
                        if this_ref_id == reference:
                            continue
                        if (reference, this_ref_id) not in pairs and (this_ref_id, reference) not in pairs:
                            pairs.append((this_ref_id, reference))

    cross_references = [
        [
            reference_links[a],
            reference_links[b]
        ]
        for (a, b) in pairs
        if a in reference_links and b in reference_links
    ]

    for (a, b) in pairs:
        if b not in reference_links:
            print(f'No link for: {b}/ In {a}')

    extern = json.load(open('static/data/external-references.json', 'r'))

    cross_references = cross_references + extern
    json.dump(cross_references, open('static/data/cross-reference.json', 'w'))

reference_finder('en/')