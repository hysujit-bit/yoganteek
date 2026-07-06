import re

with open('D:/SUJIT/PROJETCS/yoganteek/frontend/assets/footer_logo_white.svg', 'r', encoding='utf-8') as f:
    svg = f.read()

fills = re.findall(r'fill="[^"]+"', svg)
unique = sorted(set(fills))
for f in unique:
    print(f)

print("\nTotal fill attributes:", len(fills))
print("Unique fills:", len(unique))
