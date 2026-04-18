import os
import glob
import re

html_files = glob.glob('*.html')
html_files += glob.glob('public/*.html')

target_regex = re.compile(r'<div class="loader-container">\s*<div class="authentic-logo-wrapper">.*?<div class="loading-text">MARUTE</div>\s*</div>', re.DOTALL)

replacement = """<div class="loader-container">
            <video id="splashVideo" class="splash-video" src="assets/images/marute_title.mp4" autoplay muted playsinline></video>
        </div>"""

for f in html_files:
    try:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        
        new_content = target_regex.sub(replacement, content)
        if new_content != content:
            with open(f, 'w', encoding='utf-8') as file:
                file.write(new_content)
            print(f"Updated {f}")
    except Exception as e:
        print(f"Failed on {f}: {e}")
