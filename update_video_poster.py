import glob
import re

html_files = glob.glob('*.html')
html_files += glob.glob('public/*.html')

for f in html_files:
    try:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Replace the <video> tag
        new_content = re.sub(
            r'<video id="splashVideo" class="splash-video" src="assets/images/marute_title_new\.mp4" muted autoplay playsinline preload="auto" style="width: 100%; height: 100%; object-fit: contain;"></video>',
            r'<video id="splashVideo" class="splash-video" src="assets/images/marute_title_new.mp4" poster="assets/images/marute_logo_mark.jpg" muted autoplay playsinline preload="auto" style="width: 100%; height: 100%; object-fit: contain;"></video>',
            content
        )
        
        if new_content != content:
            with open(f, 'w', encoding='utf-8') as file:
                file.write(new_content)
            print(f"Updated {f}")
    except Exception as e:
        print(f"Failed on {f}: {e}")
