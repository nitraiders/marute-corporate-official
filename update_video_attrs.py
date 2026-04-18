import glob
import re

html_files = glob.glob('*.html')
html_files += glob.glob('public/*.html')

for f in html_files:
    try:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # We target the specific video tag
        # It currently looks like: <video id="splashVideo" class="splash-video" src="assets/images/marute_title_new.mp4" autoplay muted playsinline style="width: 100%; height: 100%; object-fit: contain;"></video>
        # We replace it with the bulletproof version retaining class and styles.
        new_content = re.sub(
            r'<video id="splashVideo".*?></video>',
            r'<video id="splashVideo" class="splash-video" src="assets/images/marute_title_new.mp4" muted autoplay playsinline preload="auto" style="width: 100%; height: 100%; object-fit: contain;"></video>',
            content
        )
        
        if new_content != content:
            with open(f, 'w', encoding='utf-8') as file:
                file.write(new_content)
            print(f"Updated {f}")
    except Exception as e:
        print(f"Failed on {f}: {e}")
