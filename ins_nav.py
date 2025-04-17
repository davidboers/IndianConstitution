import os

timeline = """
    <div id="timeline">
        <script src="../../../../static/src/timeline.js"></script>
        <link rel="stylesheet" type="text/css" href="../../../../static/assets/timelines.css">
    </div>"""

navbox = """
    <div id="nav">
        <script src="/static/src/nav-box.js"></script>
    </div>"""

def recursive_listdir(path):
    for root, dirs, paths in os.walk(path):
        for path in paths:
            if 'index.html' != path:
                continue
            fullpath = os.path.join(root, path)
            file = open(fullpath, 'r')
            html = file.read()
            file.close()
            if navbox in html:
                continue
            newhtml = html.replace(timeline, navbox + timeline)
            with open(fullpath, 'w') as file:
                file.write(newhtml)

recursive_listdir('en/')