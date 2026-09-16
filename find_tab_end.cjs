const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf8');

const idx1 = code.indexOf("inventoryTab === 'crafting' ? (");
if (idx1 > -1) {
  const substr = code.substring(idx1, idx1 + 10000);
  const regex = /inventoryTab === 'crafting' \? \([\s\S]+?\) : \(/;
  const match = substr.match(regex);
  if (match) {
    console.log("MATCH ENDS AT:");
    console.log(match[0].slice(-50));
  } else {
    // maybe it's `) : inventoryTab === 'guide' ? (` 
    const regex2 = /\) : inventoryTab === 'guide' \? \(/;
    const match2 = substr.match(regex2);
    if (match2) console.log("FOUND GUIDE TAB");
    else {
      // Let's just find `</>` followed by `) : (` 
      console.log("COULD NOT FIND MATCH, let's output end of crafting tab.");
      const regex3 = /<\/div>\s*<\/div>\s*<\/>\s*\)\s*:\s*\(/;
      const m3 = substr.match(regex3);
      if (m3) console.log("FOUND: ", m3[0]);
    }
  }
}
