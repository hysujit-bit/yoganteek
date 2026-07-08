import os

frontend = r'D:\SUJIT\PROJETCS\yoganteek\frontend'
files = [
    'index.html',
    'about.html',
    'services.html',
    'contact.html',
    'Yoganteek_Corporate_Landing_Page.html',
    'blog-be-concentric.html',
    'blog-stress-management.html',
    'blog-yoga-for-kids.html',
    'blog-yoga-for-women.html'
]

for f in files:
    path = os.path.join(frontend, f)
    with open(path, 'r', encoding='utf-8') as fh:
        content = fh.read()
    
    original = content
    
    # 1. Remove duplicate footer blocks - keep only the last one
    footer_positions = [m.start() for m in __import__('re').finditer(r'<footer class="bg-corp-forest', content)]
    if len(footer_positions) > 1:
        # Keep only the last footer block
        last_start = footer_positions[-1]
        # Find the end of the last footer
        last_end = content.find('</footer>', last_start)
        if last_end != -1:
            last_end += len('</footer>')
            # Remove all footers before the last one
            content = content[:footer_positions[0]] + content[last_start:last_end] + content[last_end:]
            print(f'{f}: Removed duplicate footer (had {len(footer_positions)} footers)')
    
    # 2. Remove dead script blocks referencing old nav IDs
    # Pattern: script block that references getElementById('nav') or getElementById('navBurger')
    dead_script_pattern = r'<script>\s*const nav=document\.getElementById\(\'nav\'\);.*?</script>'
    import re
    matches = list(re.finditer(dead_script_pattern, content, re.DOTALL))
    if matches:
        for m in reversed(matches):
            content = content[:m.start()] + content[m.end():]
        print(f'{f}: Removed {len(matches)} dead script block(s)')
    
    # 3. Remove duplicate tailwind CDN
    tw_pattern = r'<script src="https://cdn\.tailwindcss\.com"></script>\s*<script>\s*tailwind\.config.*?</script>'
    tw_matches = list(re.finditer(tw_pattern, content, re.DOTALL))
    if len(tw_matches) > 1:
        # Keep only the first one
        for m in reversed(tw_matches[1:]):
            content = content[:m.start()] + content[m.end():]
        print(f'{f}: Removed duplicate tailwind config')
    
    if content != original:
        with open(path, 'w', encoding='utf-8') as fh:
            fh.write(content)
    else:
        print(f'{f}: No changes needed')

print('\nDone!')
