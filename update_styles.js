const fs = require('fs');
let content = fs.readFileSync('Yoganteek_ad_enquiry.html', 'utf8');

// 1. Replace fonts
content = content.replace(
  '<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">',
  '<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">'
);

content = content.replace('serif: [\'"Playfair Display"\', \'serif\']', 'serif: [\'"Cormorant Garamond"\', \'Georgia\', \'serif\']');
content = content.replace('sans: [\'"Inter"\', \'sans-serif\']', 'sans: [\'"DM Sans"\', \'sans-serif\']');

// 2. Add corporate colors to Tailwind
const newColors = `
                        corp: {
                            sage: '#C8B8D4',
                            sagedark: '#5A4A72',
                            sagelight: '#F0EAF5',
                            sagewash: '#F7F4FB',
                            forest: '#6B5B8A',
                            cream: '#FAF7F2',
                            creamdark: '#F0ECE6',
                            warmbrown: '#8B7355',
                            gold: '#C89B3C',
                        },
`;
content = content.replace('colors: {', 'colors: {' + newColors);

// 3. Global color replacements
content = content.replace(/bg-\[#7d9284\]/g, 'bg-corp-gold');
content = content.replace(/hover:bg-\[#657a6c\]/g, 'hover:bg-[#A07830]');
content = content.replace(/focus:ring-\[#7d9284\]/g, 'focus:ring-corp-gold');
content = content.replace(/text-sage-700/g, 'text-corp-forest');
content = content.replace(/hover:text-sage-700/g, 'hover:text-corp-sagedark');
content = content.replace(/bg-sage-600/g, 'bg-corp-forest');
content = content.replace(/hover:bg-sage-700/g, 'hover:bg-corp-sagedark');
content = content.replace(/text-sage-600/g, 'text-corp-sagedark');
content = content.replace(/text-sage-500/g, 'text-corp-sage');
content = content.replace(/text-sage-100/g, 'text-corp-sagelight');
content = content.replace(/border-sage-500/g, 'border-corp-sagedark');
content = content.replace(/bg-sage-700/g, 'bg-corp-sagedark');

// Update specific background colors
content = content.replace(/bg-\[#f6f5f0\]/g, 'bg-white/95 backdrop-blur-md');
content = content.replace(/bg-beige-50/g, 'bg-corp-cream');
content = content.replace(/border-beige-100/g, 'border-corp-creamdark');
content = content.replace(/text-gray-900/g, 'text-[#2C2C2C]');
content = content.replace(/text-gray-800/g, 'text-[#2C2C2C]');
content = content.replace(/text-gray-700/g, 'text-[#555555]');
content = content.replace(/text-gray-600/g, 'text-[#555555]');

// Hero gradient updates
content = content.replace(/from-\[#b3c4b9\]/g, 'from-corp-sagewash');
content = content.replace(/via-\[#b3c4b9\]\/90/g, 'via-corp-sagewash/90');

fs.writeFileSync('Yoganteek_ad_enquiry.html', content);
console.log('Update complete');
