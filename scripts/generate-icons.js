const fs = require('fs');
const path = require('path');

// Script para gerar ícones PWA usando Canvas (ou criar placeholders)
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Função para criar ícone SVG básico
function createIconSVG(size) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4f46e5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad1)"/>
  
  <!-- Trophy Icon -->
  <g transform="translate(${size * 0.2}, ${size * 0.2}) scale(${size * 0.006})">
    <path d="M50 10 L70 10 Q80 10 80 20 L80 40 Q80 60 70 70 L60 70 L60 80 L80 80 L80 90 L20 90 L20 80 L40 80 L40 70 L30 70 Q20 60 20 40 L20 20 Q20 10 30 10 L50 10 Z" fill="white"/>
    <circle cx="35" cy="25" r="3" fill="#ffd700"/>
    <circle cx="50" cy="25" r="3" fill="#ffd700"/>
    <circle cx="65" cy="25" r="3" fill="#ffd700"/>
  </g>
  
  <!-- Game Controller -->
  <g transform="translate(${size * 0.15}, ${size * 0.55}) scale(${size * 0.004})">
    <rect x="0" y="0" width="120" height="40" rx="20" fill="white"/>
    <circle cx="25" cy="20" r="8" fill="#4f46e5"/>
    <circle cx="95" cy="20" r="8" fill="#4f46e5"/>
    <rect x="50" y="10" width="20" height="5" fill="#4f46e5"/>
    <rect x="57.5" y="2.5" width="5" height="20" fill="#4f46e5"/>
  </g>
</svg>`;
}

// Criar diretório se não existir
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Gerar ícones
iconSizes.forEach(size => {
  const svgContent = createIconSVG(size);
  const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
  
  fs.writeFileSync(svgPath, svgContent);
  console.log(`✅ Ícone SVG criado: icon-${size}x${size}.svg`);
});

// Criar arquivo HTML para conversão manual
const conversionHTML = `<!DOCTYPE html>
<html>
<head>
  <title>Converter SVG para PNG</title>
</head>
<body>
  <h2>Conversão de Ícones PWA</h2>
  <p>Use este código para converter SVG para PNG no navegador:</p>
  
  <script>
    const sizes = [${iconSizes.join(', ')}];
    
    function downloadPNG(svgElement, size) {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      const data = new XMLSerializer().serializeToString(svgElement);
      const DOMURL = window.URL || window.webkitURL || window;
      const img = new Image();
      const svg = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
      const url = DOMURL.createObjectURL(svg);
      
      img.onload = function() {
        ctx.drawImage(img, 0, 0);
        DOMURL.revokeObjectURL(url);
        
        canvas.toBlob(function(blob) {
          const a = document.createElement('a');
          a.download = \`icon-\${size}x\${size}.png\`;
          a.href = URL.createObjectURL(blob);
          a.click();
        });
      };
      
      img.src = url;
    }
    
    // Auto-converter ao carregar
    window.onload = () => {
      sizes.forEach(size => {
        fetch(\`/icons/icon-\${size}x\${size}.svg\`)
          .then(response => response.text())
          .then(svgText => {
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
            const svgElement = svgDoc.documentElement;
            
            setTimeout(() => downloadPNG(svgElement, size), size * 10);
          });
      });
    };
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(iconsDir, 'converter.html'), conversionHTML);
console.log('✅ Arquivo de conversão criado: converter.html');

console.log('\n🎨 Ícones PWA gerados com sucesso!');
console.log('📋 Próximos passos:');
console.log('1. Abra http://localhost:5174/icons/converter.html no navegador');
console.log('2. Os PNGs serão baixados automaticamente');
console.log('3. Mova os arquivos PNG para a pasta /public/icons/');
