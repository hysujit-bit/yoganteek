import re, os

INDEX_PATH = r'D:\SUJIT\PROJETCS\yoganteek\frontend\index.html'

with open(INDEX_PATH, 'r', encoding='utf-8') as f:
    index_content = f.read()

footer_match = re.search(r'(<!-- ═══════════════════════════════════════.*?</footer>)', index_content, re.DOTALL)
if not footer_match:
    print('ERROR: Could not extract footer')
    exit(1)

footer_html = footer_match.group(1)

files = [
    'blog-be-concentric.html',
    'blog-stress-management.html',
    'blog-yoga-for-kids.html',
    'blog-yoga-for-women.html'
]

frontend = r'D:\SUJIT\PROJETCS\yoganteek\frontend'

for f in files:
    path = os.path.join(frontend, f)
    with open(path, 'r', encoding='utf-8') as fh:
        content = fh.read()
    
    old_footer = '''<!-- Shared Footer -->
<div id="site-footer"></div>
<script src="./components/loader.js"></script>'''
    
    if old_footer in content:
        content = content.replace(old_footer, footer_html)
        with open(path, 'w', encoding='utf-8') as fh:
            fh.write(content)
        print(f'Fixed: {f}')
    else:
        print(f'Pattern not found in: {f}')

print('Done!')
