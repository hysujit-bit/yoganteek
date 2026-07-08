import os

# New header HTML
NEW_HEADER = '''<!-- Shared Header -->
<nav id="main-nav" class="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-black/5 transition-all duration-300">
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
</nav>
'''

# New footer HTML
NEW_FOOTER = '''
<!-- Shared Footer -->
<footer class="pt-16 pb-8" style="background-color:#FAF7F2">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
      <div class="md:col-span-2">
        <a href="index.html" class="inline-block mb-4"><img src="./assets/logo.svg" alt="Yoganteek Logo" class="h-10 w-auto"></a>
        <p class="text-sm text-gray-600 leading-relaxed mb-6 max-w-sm">Empowering lives through holistic wellness. Personalized yoga, nutrition, and lifestyle coaching for mind, body, and soul.</p>
        <div class="flex items-center gap-3">
          <a href="https://www.instagram.com/yoganteek_wellness/" target="_blank" class="w-9 h-9 rounded-full border border-black/10 inline-flex items-center justify-center text-gray-500 hover:text-white transition-all" style="hover:bg:#C8B8D4" aria-label="Instagram"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>
          <a href="https://www.facebook.com/profile.php?id=100064091137312" target="_blank" class="w-9 h-9 rounded-full border border-black/10 inline-flex items-center justify-center text-gray-500 hover:text-white transition-all" aria-label="Facebook"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
          <a href="https://www.linkedin.com/in/dr-jayashree-pattanayak-0319791a1" target="_blank" class="w-9 h-9 rounded-full border border-black/10 inline-flex items-center justify-center text-gray-500 hover:text-white transition-all" aria-label="LinkedIn"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>
          <a href="https://wa.me/919078419107?text=Hi%20Dr.%20Jayashree%2C%20I%20am%20interested%20in%20your%20wellness%20programs." target="_blank" class="w-9 h-9 rounded-full border border-black/10 inline-flex items-center justify-center text-gray-500 hover:text-white transition-all" aria-label="WhatsApp"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>
        </div>
      </div>
      <div>
        <h4 class="font-semibold text-gray-900 mb-4">Quick Links</h4>
        <ul class="space-y-3">
          <li><a href="about.html" class="text-sm text-gray-600 hover:text-corp-sagedark transition-colors">About Us</a></li>
          <li><a href="services.html" class="text-sm text-gray-600 hover:text-corp-sagedark transition-colors">Services</a></li>
          <li><a href="Yoganteek_Corporate_Landing_Page.html" class="text-sm text-gray-600 hover:text-corp-sagedark transition-colors">Corporate Wellness</a></li>
          <li><a href="contact.html" class="text-sm text-gray-600 hover:text-corp-sagedark transition-colors">Contact</a></li>
          <li><a href="blog.html" class="text-sm text-gray-600 hover:text-corp-sagedark transition-colors">Blog</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-semibold text-gray-900 mb-4">Resources</h4>
        <ul class="space-y-3">
          <li><a href="Yoganteek_ad_enquiry.html" class="text-sm text-gray-600 hover:text-corp-sagedark transition-colors">Book Consultation</a></li>
          <li><a href="https://calendly.com/jspyoga1986/30min" target="_blank" class="text-sm text-gray-600 hover:text-corp-sagedark transition-colors">Schedule Call</a></li>
          <li><a href="mailto:yoganteekwellness@gmail.com" class="text-sm text-gray-600 hover:text-corp-sagedark transition-colors">Email Us</a></li>
          <li><a href="tel:7978311312" class="text-sm text-gray-600 hover:text-corp-sagedark transition-colors">Call Us</a></li>
        </ul>
      </div>
    </div>
    <div class="border-t border-black/10 pt-6">
      <div class="flex flex-col md:flex-row items-center justify-between gap-4">
        <p class="text-xs text-gray-500">&copy; 2026 Yoganteek. All rights reserved.</p>
        <p class="text-xs text-gray-400">Bannerghatta Road, Bengaluru</p>
      </div>
    </div>
  </div>
</footer>'''

# New header/footer CSS styles
HEADER_FOOTER_CSS = '''
<style>
  /* Shared Header/Footer Styles */
  #main-nav{transition:padding .3s,box-shadow .3s}
  #main-nav.scrolled{padding-top:.5rem;padding-bottom:.5rem;box-shadow:0 4px 24px rgba(0,0,0,.09)}
  #mobile-menu{max-height:0;overflow:hidden;transition:max-height .4s cubic-bezier(.4,0,.2,1),opacity .3s;opacity:0}
  #mobile-menu.open{max-height:420px;opacity:1}
  #menu-btn span{display:block;width:22px;height:2px;background:#2C2C2C;border-radius:2px;transition:transform .3s,opacity .2s;transform-origin:center}
  #menu-btn.open span:nth-child(1){transform:translateY(7px) rotate(45deg)}
  #menu-btn.open span:nth-child(2){opacity:0;transform:scaleX(0)}
  #menu-btn.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
  .nav-link.active,.mobile-link.active{color:#5A4A72!important;font-weight:600}
</style>'''

# New header/footer JavaScript
HEADER_FOOTER_JS = '''
<script>
(function(){
  var nav=document.getElementById('main-nav');
  var btn=document.getElementById('menu-btn');
  var menu=document.getElementById('mobile-menu');
  if(nav){window.addEventListener('scroll',function(){nav.classList.toggle('scrolled',window.scrollY>20)})}
  if(btn&&menu){btn.addEventListener('click',function(){btn.classList.toggle('open');menu.classList.toggle('open');document.body.style.overflow=menu.classList.contains('open')?'hidden':''})}
  var p=window.location.pathname.split('/').pop()||'index.html';
  document.querySelectorAll('.nav-link,.mobile-link').forEach(function(l){
    var d=l.getAttribute('data-page');
    if(d&&(p.indexOf(d)!==-1||(p===''&&d==='index')))l.classList.add('active');
  });
  document.querySelectorAll('.mobile-link').forEach(function(l){l.addEventListener('click',function(){if(btn)btn.classList.remove('open');if(menu)menu.classList.remove('open');document.body.style.overflow=''})});
})();
</script>'''


def update_page(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    result = []
    i = 0
    tailwind_added = False
    header_replaced = False
    footer_replaced = False
    
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # Add Tailwind before </head>
        if '</head>' in stripped and not tailwind_added:
            tailwind = '<script src="https://cdn.tailwindcss.com"></script>\n'
            tailwind += '<script>\n'
            tailwind += 'tailwind.config={theme:{extend:{colors:{corp:{sage:"#C8B8D4",sagedark:"#5A4A72",sagelight:"#F0EAF5",sagewash:"#F7F4FB",forest:"#6B5B8A",cream:"#FAF7F2",creamdark:"#F0ECE6",warmbrown:"#8B7355",gold:"#C89B3C"}},fontFamily:{serif:["Cormorant Garamond","Georgia","serif"],sans:["DM Sans","sans-serif"]}}}}\n'
            tailwind += '</script>\n'
            result.append(tailwind)
            tailwind_added = True
        
        # Replace old header (<!-- TOP BAR --> to </nav>)
        if '<!-- TOP BAR -->' in stripped or ('<!-- top bar -->' in stripped.lower()):
            # Skip until we find </nav>
            while i < len(lines) and '</nav>' not in lines[i]:
                i += 1
            i += 1  # Skip the </nav> line
            result.append(NEW_HEADER + '\n')
            header_replaced = True
            continue
        
        # Replace old nav if no TOP BAR comment but has nav class
        if not header_replaced and '<nav' in stripped.lower() and ('class="nav' in stripped or 'id="nav' in stripped):
            # Skip until we find </nav>
            while i < len(lines) and '</nav>' not in lines[i]:
                i += 1
            i += 1  # Skip the </nav> line
            result.append(NEW_HEADER + '\n')
            header_replaced = True
            continue
        
        # Replace old footer
        if not footer_replaced and ('<!-- FOOTER -->' in stripped or '<footer' in stripped.lower()):
            if 'class="footer"' in stripped or '<!-- FOOTER -->' in stripped:
                # Skip until we find </footer>
                while i < len(lines) and '</footer>' not in lines[i]:
                    i += 1
                i += 1  # Skip the </footer> line
                result.append(NEW_FOOTER + '\n')
                footer_replaced = True
                continue
        
        # Add new CSS and JS before </body>
        if '</body>' in stripped:
            result.append(HEADER_FOOTER_CSS + '\n')
            result.append(HEADER_FOOTER_JS + '\n')
        
        result.append(line)
        i += 1
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(result)
    
    print(f'Updated: {os.path.basename(filepath)}')


# Process all pages
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
        update_page(path)
    else:
        print(f'Skipped (not found): {f}')
