const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  '<div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-2xl flex flex-col gap-6">',
  '<div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto custom-scrollbar">'
);
code = code.replace(
  '<div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-2xl flex flex-col gap-6">',
  '<div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto custom-scrollbar">'
);
code = code.replace(
  '<div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-2xl flex flex-col gap-6">',
  '<div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto custom-scrollbar">'
);

fs.writeFileSync('src/App.tsx', code);
console.log('Other modals patched.');
