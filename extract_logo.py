import re

# Read the file
with open(r'D:\SUJIT\PROJETCS\yoganteek\frontend\Yoganteek_ad_enquiry.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the base64 logo in the footer (search after line 650)
footer_start = content.find('<footer class="bg-corp-forest')
if footer_start == -1:
    footer_start = 0

footer_content = content[footer_start:footer_start+10000]

# Find the base64 logo
match = re.search(r'<img src="(data:image/svg\+xml;base64,[^"]+)"', footer_content)
if match:
    logo_base64 = match.group(1)
    print(f'Found logo: {logo_base64[:100]}...')
    print(f'Total length: {len(logo_base64)}')
    
    # Save to a file for reuse
    with open(r'D:\SUJIT\PROJETCS\yoganteek\footer_logo.txt', 'w') as f:
        f.write(logo_base64)
    print('Saved to footer_logo.txt')
else:
    print('Logo not found in footer')
