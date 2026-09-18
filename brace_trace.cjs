const fs = require('fs');
const content = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

let braceLevel = 0;
let inString = false;
let stringChar = '';
let inComment = false;
let inMultilineComment = false;

const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let j = 0;
    while (j < line.length) {
        if (inMultilineComment) {
            if (line[j] === '*' && line[j+1] === '/') {
                inMultilineComment = false;
                j++;
            }
        } else if (inComment) {
            break;
        } else if (inString) {
            if (line[j] === '\\') {
                j++; 
            } else if (line[j] === stringChar) {
                inString = false;
            }
        } else {
            if (line[j] === '/' && line[j+1] === '/') {
                inComment = true;
                j++;
            } else if (line[j] === '/' && line[j+1] === '*') {
                inMultilineComment = true;
                j++;
            } else if (line[j] === '"' || line[j] === "'" || line[j] === '`') {
                inString = true;
                stringChar = line[j];
                
                // If it's a template literal string, there can be ${...} which has braces
                // A true parser would handle template literal nesting, but let's ignore it for now or just log it
            } else if (line[j] === '{') {
                braceLevel++;
            } else if (line[j] === '}') {
                braceLevel--;
                if (braceLevel < 0) {
                    console.log(`Brace level dropped to -1 at line ${i+1}`);
                    process.exit(1);
                }
            }
        }
        j++;
    }
    inComment = false;
}

console.log("Finished. Final brace level:", braceLevel);
