"""
Update all 9 non-enquiry pages to use the booking modal.
- Add booking-modal.js script before </body>
- Change nav/footer Yoganteek_ad_enquiry.html links → openBookingModal()
- Change direct Calendly links → openBookingModal()
"""
import re, os

FRONTEND = r'D:\SUJIT\PROJETCS\yoganteek\frontend'
MODAL_SCRIPT = '<script src="./components/booking-modal.js"></script>'

PAGES = [
    'index.html',
    'about.html',
    'services.html',
    'contact.html',
    'Yoganteek_Corporate_Landing_Page.html',
    'blog.html',
    'blog-be-concentric.html',
    'blog-stress-management.html',
    'blog-yoga-for-kids.html',
    'blog-yoga-for-women.html',
]

for fname in PAGES:
    path = os.path.join(FRONTEND, fname)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # 1. Add modal script before </body> (if not already present)
    if 'booking-modal.js' not in content:
        content = content.replace('</body>', MODAL_SCRIPT + '\n</body>')
        print(f'  {fname}: Added booking-modal.js')

    # 2. Replace nav/footer links to Yoganteek_ad_enquiry.html with modal trigger
    #    Pattern: <a href="Yoganteek_ad_enquiry.html" ...>Book Consultation</a>
    #    Replace href with # and add onclick
    old_enquiry = 'href="Yoganteek_ad_enquiry.html"'
    new_enquiry = 'href="#book" onclick="openBookingModal(); return false;"'
    count = content.count(old_enquiry)
    if count > 0:
        content = content.replace(old_enquiry, new_enquiry)
        print(f'  {fname}: Replaced {count} enquiry page link(s)')

    # 3. Replace direct Calendly links in nav/footer/body
    #    Pattern: href="https://calendly.com/jspyoga1986/30min"
    old_calendly = 'href="https://calendly.com/jspyoga1986/30min"'
    new_calendly = 'href="#book" onclick="openBookingModal(); return false;"'
    count2 = content.count(old_calendly)
    if count2 > 0:
        content = content.replace(old_calendly, new_calendly)
        print(f'  {fname}: Replaced {count2} direct Calendly link(s)')

    # 4. Replace inline onclick Calendly links (some pages use target="_blank")
    #    Remove target="_blank" from book links since we use modal now
    content = content.replace(
        'onclick="openBookingModal(); return false;" target="_blank"',
        'onclick="openBookingModal(); return false;"'
    )

    # 5. Also replace the CTA button links in blog-cta sections
    #    These use class="btn" with direct calendly href
    #    Already handled by step 3

    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'  {fname}: SAVED')
    else:
        print(f'  {fname}: No changes')

print('\nDone!')
