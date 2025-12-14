// remove-bom.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testFiles = [
  'test/platform.test.js',
  'test/logger.test.js', 
  'test/utils.test.js',
  'jest.config.js'
];

console.log('Removing BOM from files...');

testFiles.forEach(file => {
  try {
    const filePath = path.join(__dirname, file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`✗ File not found: ${file}`);
      return;
    }
    
    // Read file as buffer to detect BOM
    const buffer = fs.readFileSync(filePath);
    let content;
    
    // Check for UTF-8 BOM (EF BB BF)
    if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
      // Remove BOM
      content = buffer.slice(3).toString('utf8');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Removed BOM from: ${file}`);
    } else {
      // Check for UTF-16 BOM
      let hasBOM = false;
      if (buffer.length >= 2) {
        // UTF-16 LE BOM (FF FE)
        if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
          content = buffer.slice(2).toString('utf16le');
          hasBOM = true;
        }
        // UTF-16 BE BOM (FE FF)
        else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
          content = buffer.slice(2).toString('utf16be');
          hasBOM = true;
        }
      }
      
      if (hasBOM) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Removed UTF-16 BOM from: ${file}`);
      } else {
        console.log(`✓ No BOM in: ${file}`);
      }
    }
  } catch (error) {
    console.log(`✗ Error processing ${file}: ${error.message}`);
  }
});

console.log('Done!');