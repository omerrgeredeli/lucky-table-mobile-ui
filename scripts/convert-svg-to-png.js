const fs = require('fs');
const path = require('path');
const svg2img = require('svg2img');
const { promisify } = require('util');

const svg2imgAsync = promisify(svg2img);

// Proje kök dizinini bul
const projectRoot = path.resolve(__dirname, '..');

const svgFiles = [
  { input: path.join(projectRoot, 'assets/icon.svg'), output: path.join(projectRoot, 'assets/icon.png'), size: 1024 },
  { input: path.join(projectRoot, 'assets/favicon.svg'), output: path.join(projectRoot, 'assets/favicon.png'), size: 512 },
  { input: path.join(projectRoot, 'assets/icon.svg'), output: path.join(projectRoot, 'assets/adaptive-icon.png'), size: 1024 },
];

async function convertSvgToPng() {
  for (const file of svgFiles) {
    try {
      const svgContent = fs.readFileSync(file.input, 'utf8');
      
      const buffer = await svg2imgAsync(svgContent, {
        width: file.size,
        height: file.size,
      });
      
      fs.writeFileSync(file.output, buffer);
      console.log(`✓ Converted ${file.input} -> ${file.output} (${file.size}x${file.size})`);
    } catch (error) {
      console.error(`Error converting ${file.input}:`, error);
    }
  }
}

convertSvgToPng().catch(console.error);

