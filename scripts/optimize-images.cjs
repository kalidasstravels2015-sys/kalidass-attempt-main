const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function optimizeDriverImages() {
  const driversDir = path.join(__dirname, '..', 'public', 'images', 'drivers');
  const files = fs.readdirSync(driversDir);

  for (const file of files) {
    if (!file.endsWith('.webp')) continue;
    const filePath = path.join(driversDir, file);
    const stats = fs.statSync(filePath);

    // Only re-compress if larger than 250KB
    if (stats.size > 250 * 1024) {
      console.log(`Optimizing driver image ${file} (${(stats.size / 1024).toFixed(0)} KB)...`);
      const buffer = fs.readFileSync(filePath);
      const optimizedBuffer = await sharp(buffer)
        .resize({ width: 600, height: 600, fit: 'cover', position: 'top' })
        .webp({ quality: 80, effort: 6 })
        .toBuffer();

      fs.writeFileSync(filePath, optimizedBuffer);
      const newStats = fs.statSync(filePath);
      console.log(`  -> Reduced to ${(newStats.size / 1024).toFixed(0)} KB (-${(((stats.size - newStats.size) / stats.size) * 100).toFixed(0)}%)`);
    }
  }
}

async function optimizeServiceImages() {
  const templeTourPath = path.join(__dirname, '..', 'public', 'images', 'services', 'temple-tours.webp');
  if (fs.existsSync(templeTourPath)) {
    const stats = fs.statSync(templeTourPath);
    if (stats.size > 300 * 1024) {
      console.log(`Optimizing service image temple-tours.webp (${(stats.size / 1024).toFixed(0)} KB)...`);
      const buffer = fs.readFileSync(templeTourPath);
      const optimizedBuffer = await sharp(buffer)
        .resize({ width: 1000, withoutEnlargement: true })
        .webp({ quality: 82, effort: 6 })
        .toBuffer();

      fs.writeFileSync(templeTourPath, optimizedBuffer);
      const newStats = fs.statSync(templeTourPath);
      console.log(`  -> Reduced to ${(newStats.size / 1024).toFixed(0)} KB (-${(((stats.size - newStats.size) / stats.size) * 100).toFixed(0)}%)`);
    }
  }
}

async function run() {
  console.log('Starting image optimization...');
  await optimizeDriverImages();
  await optimizeServiceImages();
  console.log('Optimization complete!');
}

run().catch(err => {
  console.error('Image optimization failed:', err);
  process.exit(1);
});
