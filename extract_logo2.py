import re

with open(r'D:\SUJIT\PROJETCS\yoganteek\frontend\Yoganteek_ad_enquiry.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the base64 logo
idx = content.find('data:image/svg+xml;base64,')
if idx > 0:
    # Find the closing quote
    end_idx = content.find('"', idx)
    logo_base64 = content[idx:end_idx]
    print(f'Found logo, length: {len(logo_base64)}')
    
    # Save to a file
    with open(r'D:\SUJIT\PROJETCS\yoganteek\footer_logo.txt', 'w') as f:
        f.write(logo_base64)
    print('Saved to footer_logo.txt')
else:
    print('Logo not found')
