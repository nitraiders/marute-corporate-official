import os
import glob

html_files = glob.glob('*.html')
html_files += glob.glob('public/*.html')

for f in html_files:
    try:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        
        new_content = content.replace('marute_title.mp4', 'marute_title_new.mp4')
        
        if new_content != content:
            with open(f, 'w', encoding='utf-8') as file:
                file.write(new_content)
            print(f"Updated {f}")
    except Exception as e:
        print(f"Failed on {f}: {e}")
