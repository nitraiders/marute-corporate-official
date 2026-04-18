import glob
import re

html_files = glob.glob('*.html')
html_files += glob.glob('public/*.html')

for f in html_files:
    try:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Replace the <video> tag with <img> WebP
        new_content = re.sub(
            r'<video id="splashVideo" class="splash-video".*?></video>',
            r'<img id="splashImage" class="splash-video" src="assets/images/marute_title_new.webp" style="width: 100%; height: 100%; object-fit: contain;" alt="Marute Splash">',
            content
        )
        
        if new_content != content:
            with open(f, 'w', encoding='utf-8') as file:
                file.write(new_content)
            print(f"Updated {f}")
    except Exception as e:
        print(f"Failed on {f}: {e}")
