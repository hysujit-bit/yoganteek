import os

FRONTEND = r'D:\SUJIT\PROJETCS\yoganteek\frontend'
PAGES = [
    'index.html', 'about.html', 'services.html', 'contact.html',
    'Yoganteek_Corporate_Landing_Page.html', 'blog.html',
    'blog-be-concentric.html', 'blog-stress-management.html',
    'blog-yoga-for-kids.html', 'blog-yoga-for-women.html',
    'components/header.html'
]

# Desktop nav link
DESKTOP_OLD = '      <a href="contact.html" class="nav-link font-medium text-sm text-gray-700 hover:text-corp-sagedark transition-colors" data-page="contact">Contact</a>\n'
# Mobile menu link
MOBILE_OLD = '      <a href="contact.html" class="mobile-link block py-3 text-base font-medium text-gray-800 hover:text-corp-sagedark transition-colors" data-page="contact">Contact</a>\n'

for fname in PAGES:
    path = os.path.join(FRONTEND, fname)
    if not os.path.exists(path):
        print(f'Skipped (not found): {fname}')
        continue
    
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    content = content.replace(DESKTOP_OLD, '')
    content = content.replace(MOBILE_OLD, '')
    
    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated: {fname}')
    else:
        print(f'No changes: {fname}')

print('Done!')
