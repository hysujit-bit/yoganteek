import os

base = 'D:/SUJIT/PROJETCS/yoganteek/frontend'
for fname in sorted(os.listdir(base)):
    if fname.endswith('.html') and os.path.isfile(os.path.join(base, fname)):
        fpath = os.path.join(base, fname)
        with open(fpath, 'r', encoding='utf-8') as f:
            c = f.read()
        has_booking = 'booking-modal.js' in c
        nav_count = c.count('<nav id="main-nav"')
        footer_count = c.count('</footer>')
        print('%s: booking=%s navs=%d footers=%d' % (fname, has_booking, nav_count, footer_count))
