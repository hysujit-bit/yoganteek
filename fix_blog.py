import re

BLOG_PATH = r'D:\SUJIT\PROJETCS\yoganteek\frontend\blog.html'

with open(BLOG_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace header placeholder with inline nav
OLD_HEADER = '<div id="site-header"></div>'
NEW_HEADER = '''<nav id="main-nav" class="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-black/5 transition-all duration-300">
  <div class="max-w-6xl mx-auto px-5 flex items-center justify-between h-[72px]">
    <a href="index.html" class="flex-shrink-0">
      <img src="./assets/logo.svg" alt="Yoganteek Logo" class="h-10 md:h-11 w-auto transition-all duration-300">
    </a>
    <div class="hidden md:flex items-center gap-7">
      <a href="index.html" class="nav-link font-medium text-sm text-gray-700 hover:text-corp-sagedark transition-colors" data-page="index">Home</a>
      <a href="about.html" class="nav-link font-medium text-sm text-gray-700 hover:text-corp-sagedark transition-colors" data-page="about">About</a>
      <a href="services.html" class="nav-link font-medium text-sm text-gray-700 hover:text-corp-sagedark transition-colors" data-page="services">Services</a>
      <a href="Yoganteek_Corporate_Landing_Page.html" class="nav-link font-medium text-sm text-gray-700 hover:text-corp-sagedark transition-colors" data-page="corporate">Corporate</a>
      <a href="contact.html" class="nav-link font-medium text-sm text-gray-700 hover:text-corp-sagedark transition-colors" data-page="contact">Contact</a>
      <a href="blog.html" class="nav-link font-medium text-sm text-gray-700 hover:text-corp-sagedark transition-colors" data-page="blog">Blog</a>
      <a href="Yoganteek_ad_enquiry.html" class="ml-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-white text-sm font-semibold shadow-sm hover:shadow-md" style="background:linear-gradient(135deg,#C89B3C 0%,#A07830 100%)">Book Consultation</a>
    </div>
    <button id="menu-btn" class="md:hidden relative z-50 w-8 h-8 flex flex-col justify-center items-center gap-[5px]" aria-label="Open menu">
      <span class="block w-[22px] h-[2px] bg-gray-800 rounded transition-all duration-300 origin-center"></span>
      <span class="block w-[22px] h-[2px] bg-gray-800 rounded transition-all duration-300"></span>
      <span class="block w-[22px] h-[2px] bg-gray-800 rounded transition-all duration-300 origin-center"></span>
    </button>
  </div>
  <div id="mobile-menu" class="md:hidden overflow-hidden max-h-0 opacity-0 transition-all duration-400 ease-in-out">
    <div class="bg-white/95 backdrop-blur-md px-6 py-6 border-t border-black/5 space-y-1">
      <a href="index.html" class="mobile-link block py-3 text-base font-medium text-gray-800 hover:text-corp-sagedark transition-colors" data-page="index">Home</a>
      <a href="about.html" class="mobile-link block py-3 text-base font-medium text-gray-800 hover:text-corp-sagedark transition-colors" data-page="about">About</a>
      <a href="services.html" class="mobile-link block py-3 text-base font-medium text-gray-800 hover:text-corp-sagedark transition-colors" data-page="services">Services</a>
      <a href="Yoganteek_Corporate_Landing_Page.html" class="mobile-link block py-3 text-base font-medium text-gray-800 hover:text-corp-sagedark transition-colors" data-page="corporate">Corporate</a>
      <a href="contact.html" class="mobile-link block py-3 text-base font-medium text-gray-800 hover:text-corp-sagedark transition-colors" data-page="contact">Contact</a>
      <a href="blog.html" class="mobile-link block py-3 text-base font-medium text-gray-800 hover:text-corp-sagedark transition-colors" data-page="blog">Blog</a>
      <a href="Yoganteek_ad_enquiry.html" class="mt-4 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white text-sm font-semibold shadow-sm" style="background:linear-gradient(135deg,#C89B3C 0%,#A07830 100%)">Book Consultation</a>
    </div>
  </div>
</nav>'''

if OLD_HEADER in content:
    content = content.replace(OLD_HEADER, NEW_HEADER)
    print('Header replaced')
else:
    print('Header placeholder not found')

# Replace footer placeholder with inline footer
# First extract the full footer from index.html
INDEX_PATH = r'D:\SUJIT\PROJETCS\yoganteek\frontend\index.html'
with open(INDEX_PATH, 'r', encoding='utf-8') as f:
    index_content = f.read()

# Extract footer from index.html
footer_match = re.search(r'(<!-- ═══════════════════════════════════════.*?</footer>)', index_content, re.DOTALL)
if footer_match:
    footer_html = footer_match.group(1)
else:
    print('ERROR: Could not extract footer from index.html')
    footer_html = None

if footer_html:
    OLD_FOOTER = '''<!-- Shared Footer -->
<div id="site-footer"></div>
<script src="./components/loader.js"></script>'''
    
    NEW_FOOTER = footer_html
    
    if OLD_FOOTER in content:
        content = content.replace(OLD_FOOTER, NEW_FOOTER)
        print('Footer replaced')
    else:
        # Try alternate footer placeholder patterns
        alt_patterns = [
            '<div id="site-footer"></div>',
            '<div id="site-footer"></div>\n<script src="./components/loader.js"></script>'
        ]
        replaced = False
        for pat in alt_patterns:
            if pat in content:
                content = content.replace(pat, NEW_FOOTER)
                print(f'Footer replaced (pattern: {pat[:40]}...)')
                replaced = True
                break
        if not replaced:
            print(f'Footer placeholder not found. Looking for site-footer...')
            # Just insert footer before </body>
            content = content.replace('</body>', NEW_FOOTER + '\n</body>')
            print('Footer inserted before </body>')

# Now remove the old footer CSS (dark bg) since we use the inline one
# Remove old footer styles
content = content.replace('''/* FOOTER */
.footer{background:var(--dark);color:var(--sage);text-align:center;padding:48px 24px 32px}
.footer-logo img{height:50px;margin-bottom:16px}
.footer-links{display:flex;gap:24px;justify-content:center;flex-wrap:wrap;margin-bottom:20px}
.footer-links a{color:var(--sage);text-decoration:none;font-size:.9rem;transition:color .3s}
.footer-links a:hover{color:var(--gold)}
.footer-social{display:flex;gap:16px;justify-content:center;margin-bottom:16px}
.footer-social a{color:var(--sage);transition:color .3s}
.footer-social a:hover{color:var(--gold)}
.footer-social svg{width:20px;height:20px}
.footer-copy{font-size:.8rem;opacity:.7}''', '')

# Remove the duplicate tailwind CDN scripts
content = content.replace('<script src="https://cdn.tailwindcss.com"></script>\n<script>\n    tailwind.config = {\n        theme: {\n            extend: {\n                colors: {\n                    corp: {\n                        sage: \'#C8B8D4\',\n                        sagedark: \'#5A4A72\',\n                        sagelight: \'#F0EAF5\',\n                        sagewash: \'#F7F4FB\',\n                        forest: \'#6B5B8A\',\n                        cream: \'#FAF7F2\',\n                        creamdark: \'#F0ECE6\',\n                        warmbrown: \'#8B7355\',\n                        gold: \'#C89B3C\',\n                    },\n                },\n                fontFamily: {\n                    serif: [\'"Cormorant Garamond"\', \'Georgia\', \'serif\'],\n                    sans: [\'"DM Sans"\', \'sans-serif\'],\n                }\n            }\n        }\n    }\n</script>\n<script src="https://cdn.tailwindcss.com"></script>\n<script>\ntailwind.config={theme:{extend:{colors:{corp:{sage:"#C8B8D4",sagedark:"#5A4A72",sagelight:"#F0EAF5",sagewash:"#F7F4FB",forest:"#6B5B8A",cream:"#FAF7F2",creamdark:"#F0ECE6",warmbrown:"#8B7355",gold:"#C89B3C"}},fontFamily:{serif:["Cormorant Garamond","Georgia","serif"],sans:["DM Sans","sans-serif"]}}}}\n</script>', '<script src="https://cdn.tailwindcss.com"></script>\n<script>\ntailwind.config={theme:{extend:{colors:{corp:{sage:"#C8B8D4",sagedark:"#5A4A72",sagelight:"#F0EAF5",sagewash:"#F7F4FB",forest:"#6B5B8A",cream:"#FAF7F2",creamdark:"#F0ECE6",warmbrown:"#8B7355",gold:"#C89B3C"}},fontFamily:{serif:["Cormorant Garamond","Georgia","serif"],sans:["DM Sans","sans-serif"]}}}}\n</script>')

# Fix nav id references - blog.html uses 'nav' and 'navBurger' but new nav uses 'main-nav' and 'menu-btn'
content = content.replace("const nav=document.getElementById('nav');", "const nav=document.getElementById('main-nav');")
content = content.replace("const burger=document.getElementById('navBurger');", "")
content = content.replace("const navLinks=document.querySelector('.nav-links');", "")
content = content.replace("burger.addEventListener('click',()=>{burger.classList.toggle('open');navLinks.classList.toggle('open');});", "")
content = content.replace("document.querySelectorAll('.nav-links a').forEach(a=>a.addEventListener('click',()=>{burger.classList.remove('open');navLinks.classList.remove('open');}));", "")

with open(BLOG_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done!')
