const fs = require('fs');
const content = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

let parenLevel = 0;
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
            // End of line comment
            break;
        } else if (inString) {
            if (line[j] === '\\') {
                j++; // skip escaped char
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
            } else if (line[j] === '(') {
                parenLevel++;
            } else if (line[j] === ')') {
                parenLevel--;
                if (parenLevel < 0) {
                    console.log(`Paren level dropped to -1 at line ${i+1}`);
                    process.exit(1);
                }
            }
        }
        j++;
    }
    inComment = false; // reset for next line
}

console.log("Finished. Final paren level:", parenLevel);
