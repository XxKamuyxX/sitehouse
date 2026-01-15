import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate version object with current timestamp
const version = {
  buildDate: new Date().getTime(),
  buildTime: new Date().toISOString()
};

// Ensure public directory exists
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write version.json to public directory
const versionPath = path.join(publicDir, 'version.json');
fs.writeFileSync(versionPath, JSON.stringify(version, null, 2));

console.log('✅ Build version generated:', version);
console.log('📁 Saved to:', versionPath);
