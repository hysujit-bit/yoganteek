import os

base = 'D:/SUJIT/PROJETCS/yoganteek/frontend'
observer_script = """<script>
document.addEventListener('DOMContentLoaded',function(){
  var obs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}});
  },{threshold:0.1});
  document.querySelectorAll('.fade-up').forEach(function(el){obs.observe(el);});
});
</script>"""

for fname in sorted(os.listdir(base)):
    if fname.endswith('.html') and os.path.isfile(os.path.join(base, fname)):
        fpath = os.path.join(base, fname)
        with open(fpath, 'r', encoding='utf-8') as f:
            c = f.read()
        
        has_fadeup = '.fade-up' in c
        has_observer = 'IntersectionObserver' in c
        
        if has_fadeup and not has_observer:
            # Add before booking-modal.js or before </body>
            if 'booking-modal.js' in c:
                c = c.replace('<script src="./components/booking-modal.js"></script>',
                    observer_script + '\n<script src="./components/booking-modal.js"></script>')
            else:
                c = c.replace('</body>', observer_script + '\n</body>')
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(c)
            print('Added IntersectionObserver to: %s' % fname)
        elif has_fadeup and has_observer:
            print('Already has IntersectionObserver: %s' % fname)
        else:
            print('No fade-up classes: %s' % fname)
