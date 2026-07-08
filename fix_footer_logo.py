import os
import re

# Read the base64 logo
with open(r'D:\SUJIT\PROJETCS\yoganteek\footer_logo.txt', 'r', encoding='utf-8') as f:
    logo_base64 = f.read()

# New footer logo img tag with base64
new_logo_tag = f'<img src="{logo_base64}" alt="Yoganteek" class="h-10 w-auto mb-3">'

def update_footer_logo(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace the old logo tag with filter
    old_pattern = r'<img src="\./assets/logo\.svg" alt="Yoganteek" class="h-10 w-auto mb-3" style="filter: brightness\(0\) invert\(1\);">'
    
    if re.search(old_pattern, content):
        content = re.sub(old_pattern, new_logo_tag, content)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f'Updated: {os.path.basename(filepath)}')
    else:
        print(f'Skipped (no match): {os.path.basename(filepath)}')


# Update all pages
frontend = r'D:\SUJIT\PROJETCS\yoganteek\frontend'
files = [
    'index.html',
    'about.html',
    'services.html',
    'contact.html',
    'Yoganteek_Corporate_Landing_Page.html',
    'blog.html',
    'blog-be-concentric.html',
    'blog-stress-management.html',
    'blog-yoga-for-kids.html',
    'blog-yoga-for-women.html'
]

for f in files:
    path = os.path.join(frontend, f)
    if os.path.exists(path):
        update_footer_logo(path)
    else:
        print(f'Not found: {f}')
