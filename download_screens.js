import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the output file containing the Stitch screen details
const screensDataPath = 'C:/Users/Admin/.gemini/antigravity/brain/1e2d1588-edf7-4e3f-a739-f39c9e3299b3/.system_generated/steps/2831/output.txt';
const outputDir = path.join(__dirname, 'stitch_screens');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Download function helper
const downloadFile = (url, destPath) => {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: Status ${response.statusCode}`));
        return;
      }
      const fileStream = fs.createWriteStream(destPath);
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};

async function startDownload() {
  try {
    const rawData = fs.readFileSync(screensDataPath, 'utf8');
    const data = JSON.parse(rawData);

    if (!data.screens || data.screens.length === 0) {
      console.log("No screens found in the Stitch project database.");
      return;
    }

    console.log(`Found ${data.screens.length} screens. Starting download...`);

    for (let i = 0; i < data.screens.length; i++) {
      const screen = data.screens[i];
      const title = screen.title || `Screen_${i + 1}`;
      const downloadUrl = screen.htmlCode?.downloadUrl;

      if (!downloadUrl) {
        console.log(`[-] Skipping "${title}" (No HTML download link)`);
        continue;
      }

      // Sanitize filename
      const safeTitle = title.replace(/[^a-z0-9\s-_]/gi, '').replace(/\s+/g, '_');
      const filename = `${safeTitle}.html`;
      const destPath = path.join(outputDir, filename);

      console.log(`[+] Downloading [${i + 1}/${data.screens.length}]: ${title} -> ${filename}`);
      try {
        await downloadFile(downloadUrl, destPath);
        console.log(`    Success.`);
      } catch (err) {
        console.error(`    Error downloading "${title}":`, err.message);
      }
    }

    console.log("-----------------------------------------");
    console.log(`COMPLETED: Screens saved inside: ${outputDir}`);
    console.log("-----------------------------------------");
  } catch (error) {
    console.error("Failed to run downloader script:", error);
  }
}

startDownload();
