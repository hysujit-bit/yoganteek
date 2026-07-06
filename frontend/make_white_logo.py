import re

with open('D:/SUJIT/PROJETCS/yoganteek/frontend/assets/footer_logo.svg', 'r', encoding='utf-8') as f:
    svg = f.read()

# Replace ALL dark fill colors with white
svg_white = re.sub(r'fill="#[0-9a-fA-F]+"', 'fill="#ffffff"', svg)

# Also replace any stroke colors
svg_white = re.sub(r'stroke="#[0-9a-fA-F]+"', 'stroke="#ffffff"', svg_white)

with open('D:/SUJIT/PROJETCS/yoganteek/frontend/assets/footer_logo_white.svg', 'w', encoding='utf-8') as f:
    f.write(svg_white)

# Verify
fills = re.findall(r'fill="[^"]+"', svg_white)
unique = sorted(set(fills))
print("Fills in white version:", unique)
