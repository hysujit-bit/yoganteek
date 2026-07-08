import os

HIDE_TOPBAR_CSS = '''
<style>
  .top-bar { display: none !important; }
</style>'''

def hide_topbar(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if already hidden
    if '.top-bar { display: none !important; }' in content or ".top-bar{display:none!important}" in content:
        print(f'Already hidden: {os.path.basename(filepath)}')
        return
    
    # Add hide CSS before </head>
    if '</head>' in content:
        content = content.replace('</head>', HIDE_TOPBAR_CSS + '\n</head>')
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f'Hidden: {os.path.basename(filepath)}')
    else:
        print(f'Skipped (no </head>): {os.path.basename(filepath)}')


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
        hide_topbar(path)
    else:
        print(f'Not found: {f}')
