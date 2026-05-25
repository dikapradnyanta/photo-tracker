const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Additional patterns
  content = content.replace(/bg-obsidian\s+text-paper\s+dark:bg-white\s+dark:text-obsidian/g, 'bg-foreground text-background');
  content = content.replace(/bg-obsidian\s+text-paper\s+dark:bg-paper\s+dark:text-obsidian/g, 'bg-foreground text-background');
  content = content.replace(/bg-obsidian\s+text-paper/g, 'bg-foreground text-background');
  content = content.replace(/dark:text-white/g, '');
  content = content.replace(/dark:border-white\/\d+/g, 'border-border');
  content = content.replace(/bg-black\/\[[0-9.]+\]\s+dark:bg-white\/\[[0-9.]+\]/g, 'bg-surface-alt');
  content = content.replace(/dark:bg-white\/\d+/g, 'bg-surface-alt');
  content = content.replace(/bg-black\/\d+\s+backdrop-blur/g, 'bg-background/80 backdrop-blur');
  content = content.replace(/bg-white\/10\s+dark:bg-black\/20/g, 'bg-surface-alt');
  content = content.replace(/border-white\/20/g, 'border-border');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function walkDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceInFile(fullPath);
    }
  });
}

walkDir(directoryPath);
console.log('Done!');
