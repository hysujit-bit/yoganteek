"""
Yoganteek Build Script
Inlines shared header and footer HTML into all pages.
Safe to re-run: removes old inlined header/footer before inserting fresh ones.
Run: python build.py
"""
import os
import re

FRONTEND_DIR = os.path.dirname(os.path.abspath(__file__))
COMPONENTS_DIR = os.path.join(FRONTEND_DIR, 'components')

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def remove_old_header(content):
    """Remove old inlined header: from <!-- SITE HEADER (built) --> to the start of page content."""
    # Remove the marker and everything up to (but not including) the first <section, <main, or <div id=
    pattern = r'<!-- SITE HEADER \(built\) -->.*?(?=\n<(?:section|main|div id=|div class=|article))'
    content = re.sub(pattern, '', content, count=1, flags=re.DOTALL)
    return content

def remove_old_footer(content):
    """Remove old inlined footer: from <!-- SITE FOOTER (built) --> to </body>."""
    pattern = r'<!-- SITE FOOTER \(built\) -->.*?(?=</body>)'
    content = re.sub(pattern, '', content, count=1, flags=re.DOTALL)
    return content

def remove_placeholder_divs(content):
    """Remove <div id="site-header"> and <div id="site-footer"> placeholders."""
    content = content.replace('<div id="site-header"></div>', '')
    content = content.replace('<div id="site-footer"></div>', '')
    return content

def remove_loader_script(content):
    """Remove loader.js script tags."""
    content = re.sub(r'\s*<script src="[^"]*loader\.js"></script>', '', content)
    return content

def build():
    # Read shared components
    header_html = read_file(os.path.join(COMPONENTS_DIR, 'header.html'))
    footer_html = read_file(os.path.join(COMPONENTS_DIR, 'footer.html'))

    # Find all HTML pages (exclude components dir)
    pages = []
    for f in os.listdir(FRONTEND_DIR):
        if f.endswith('.html') and os.path.isfile(os.path.join(FRONTEND_DIR, f)):
            pages.append(f)

    print("Building %d pages..." % len(pages))

    for page_file in sorted(pages):
        page_path = os.path.join(FRONTEND_DIR, page_file)
        content = read_file(page_path)

        # Step 1: Remove old inlined header/footer
        content = remove_old_header(content)
        content = remove_old_footer(content)
        content = remove_placeholder_divs(content)
        content = remove_loader_script(content)

        # Step 2: Find insertion points
        # Header: insert after <body>
        body_match = re.search(r'<body[^>]*>', content)
        if body_match:
            insert_pos = body_match.end()
            content = content[:insert_pos] + '\n<!-- SITE HEADER (built) -->\n' + header_html + '\n' + content[insert_pos:]

        # Footer: insert before </body>
        content = content.replace('</body>', '<!-- SITE FOOTER (built) -->\n' + footer_html + '\n</body>')

        write_file(page_path, content)
        print("  Built: %s" % page_file)

    print("Done! All pages have inlined header/footer.")

if __name__ == '__main__':
    build()
