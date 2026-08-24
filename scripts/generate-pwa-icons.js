/**
 * Generate PWA icons (192x192 and 512x512 PNG) from an SVG source.
 * The icon is a gradient square with the RCSI monogram.
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = '/home/z/my-project/public';

// SVG source for the icon — a rounded square with gradient and "RCSI" text
const iconSvg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#22d3ee;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)" />
  <text x="256" y="200" font-family="Arial, sans-serif" font-size="48" font-weight="bold"
        fill="white" text-anchor="middle" opacity="0.85" letter-spacing="2">EL SALVADOR</text>
  <text x="256" y="260" font-family="Arial, sans-serif" font-size="48" font-weight="bold"
        fill="white" text-anchor="middle" opacity="0.85" letter-spacing="2">DIVISION</text>
  <text x="256" y="350" font-family="Arial, sans-serif" font-size="120" font-weight="900"
        fill="white" text-anchor="middle" letter-spacing="-2">RCSI</text>
</svg>`;

// Also create a simpler maskable icon (with padding for Android adaptive icons)
const maskableSvg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#22d3ee;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)" />
  <text x="256" y="180" font-family="Arial, sans-serif" font-size="42" font-weight="bold"
        fill="white" text-anchor="middle" opacity="0.85" letter-spacing="2">EL SALVADOR</text>
  <text x="256" y="230" font-family="Arial, sans-serif" font-size="42" font-weight="bold"
        fill="white" text-anchor="middle" opacity="0.85" letter-spacing="2">DIVISION</text>
  <text x="256" y="340" font-family="Arial, sans-serif" font-size="110" font-weight="900"
        fill="white" text-anchor="middle" letter-spacing="-2">RCSI</text>
</svg>`;

async function generateIcons() {
  // Generate 192x192 icon
  await sharp(Buffer.from(iconSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'icon-192.png'));
  console.log('✓ Generated icon-192.png');

  // Generate 512x512 icon
  await sharp(Buffer.from(iconSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'icon-512.png'));
  console.log('✓ Generated icon-512.png');

  // Generate maskable 512x512 icon (for Android adaptive icons)
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'icon-maskable-512.png'));
  console.log('✓ Generated icon-maskable-512.png');

  // Generate favicon (32x32)
  await sharp(Buffer.from(iconSvg))
    .resize(32, 32)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'favicon-32.png'));
  console.log('✓ Generated favicon-32.png');

  // Generate apple-touch-icon (180x180)
  await sharp(Buffer.from(iconSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
  console.log('✓ Generated apple-touch-icon.png');

  console.log('\nAll PWA icons generated successfully.');
}

generateIcons().catch(console.error);
