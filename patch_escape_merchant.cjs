const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "      if (e.key === 'Escape') {\n        if (furnaceOpen) {",
  "      if (e.key === 'Escape') {\n        if (merchantOpen) {\n          setMerchantOpen(false);\n          returnCursorItemToInventory(cursorItem);\n          return;\n        }\n        if (furnaceOpen) {"
);

fs.writeFileSync('src/App.tsx', code);
console.log('Merchant escape logic patched.');
