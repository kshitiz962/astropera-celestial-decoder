// Astropera Project Sanity Test File
console.log("-----------------------------------------");
console.log("ASTROPERA: Starting Workspace Sanity Test...");
console.log("-----------------------------------------");

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requiredFiles = [
  'package.json',
  'index.html',
  'src/main.jsx',
  'src/App.jsx',
  'src/index.css'
];

let allPassed = true;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`[PASS] Found required file: ${file}`);
  } else {
    console.error(`[FAIL] Missing required file: ${file}`);
    allPassed = false;
  }
});

console.log("-----------------------------------------");
if (allPassed) {
  console.log("RESULT: All core files are present and healthy!");
} else {
  console.log("RESULT: Some files are missing. Check directory status.");
}
console.log("-----------------------------------------");
