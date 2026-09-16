const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// find the second skills tab inserted at 2360
let startIdx = -1;
let endIdx = -1;
for (let i = 2300; i < lines.length; i++) {
  if (lines[i].includes(") : inventoryTab === 'skills' ? (")) {
    startIdx = i;
  }
  if (startIdx !== -1 && lines[i].includes(") : null}")) {
    endIdx = i;
    break;
  }
}

if (startIdx !== -1 && endIdx !== -1) {
  // We need to replace the entire block with `        )}`
  const before = lines.slice(0, startIdx);
  const after = lines.slice(endIdx + 1);
  const newLines = [...before, '        )}', ...after];
  fs.writeFileSync('src/App.tsx', newLines.join('\n'));
  console.log('Removed duplicate skills tab and fixed showNPCMessage closing tag.');
} else {
  console.log('Could not find duplicate block');
}
