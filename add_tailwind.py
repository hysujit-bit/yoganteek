import os

def add_tailwind_to_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check if Tailwind is already included
    if 'tailwindcss.com' in content:
        print(f'Tailwind already in: {filepath}')
        return

    # Add Tailwind CSS CDN and config before </head>
    tailwind_script = '''<script src="https://cdn.tailwindcss.com"></script>
<script>
    tailwind.config = {
        theme: {
            extend: {
                colors: {
                    corp: {
                        sage: '#C8B8D4',
                        sagedark: '#5A4A72',
                        sagelight: '#F0EAF5',
                        sagewash: '#F7F4FB',
                        forest: '#6B5B8A',
                        cream: '#FAF7F2',
                        creamdark: '#F0ECE6',
                        warmbrown: '#8B7355',
                        gold: '#C89B3C',
                    },
                },
                fontFamily: {
                    serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
                    sans: ['"DM Sans"', 'sans-serif'],
                }
            }
        }
    }
</script>'''

    # Insert before </head>
    content = content.replace('</head>', tailwind_script + '\n</head>')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f'Added Tailwind to: {filepath}')

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
        add_tailwind_to_file(filepath)
    else:
        print(f'Not found: {filepath}')
