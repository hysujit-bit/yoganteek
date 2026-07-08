import re
import os

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove old top bar and nav (header section)
    # Find from <!-- TOP BAR --> or equivalent to the end of </nav>
    content = re.sub(
        r'<!-- TOP BAR -->.*?</nav>',
        '<!-- Shared Header -->\n<div id="site-header"></div>\n',
        content,
        flags=re.DOTALL
    )

    # Remove old footer section
    content = re.sub(
        r'<!-- FOOTER -->.*?(?=<script>)',
        '',
        content,
        flags=re.DOTALL
    )

    # Add component loader if not present
    if 'components/loader.js' not in content:
        content = content.replace(
            '</body>',
            '<!-- Shared Footer -->\n<div id="site-footer"></div>\n<script src="./components/loader.js"></script>\n</body>'
        )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f'Updated: {filepath}')

# Update all pages
frontend_dir = r'D:\SUJIT\PROJETCS\yoganteek\frontend'
files_to_update = [
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

for f in files_to_update:
    filepath = os.path.join(frontend_dir, f)
    if os.path.exists(filepath):
        update_file(filepath)
    else:
        print(f'Not found: {filepath}')
