// Run: node generate-icons.js
// Generates simple placeholder icons for PWA

import { writeFileSync } from 'fs'

function createSVG(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#0c0c0c"/>
  <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle"
    font-family="Arial Black, sans-serif" font-weight="900" font-size="${size * 0.28}" fill="#e8f74a">
    COACH
  </text>
  <text x="50%" y="75%" dominant-baseline="middle" text-anchor="middle"
    font-family="Arial Black, sans-serif" font-weight="900" font-size="${size * 0.2}" fill="#e8f74a">
    AI
  </text>
</svg>`
}

writeFileSync('public/icons/icon-192.svg', createSVG(192))
writeFileSync('public/icons/icon-512.svg', createSVG(512))
console.log('SVG icons created. Use an online converter to make .png versions, or the app will work without them.')
