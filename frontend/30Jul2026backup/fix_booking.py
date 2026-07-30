import os

base = 'D:/SUJIT/PROJETCS/yoganteek/frontend'
booking_tag = '<script src="./components/booking-modal.js"></script>'

for fname in sorted(os.listdir(base)):
    if fname.endswith('.html') and os.path.isfile(os.path.join(base, fname)):
        fpath = os.path.join(base, fname)
        with open(fpath, 'r', encoding='utf-8') as f:
            c = f.read()
        
        if booking_tag not in c:
            # Add before </body>
            c = c.replace('</body>', booking_tag + '\n</body>')
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(c)
            print('Added booking-modal.js to: %s' % fname)
        else:
            print('Already has booking-modal.js: %s' % fname)
