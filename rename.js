import fs from 'fs';

// Update metadata.json
let meta = JSON.parse(fs.readFileSync('metadata.json', 'utf8'));
meta.name = "Lange: Origins";
meta.description = "A 2D multiplayer sandbox survival game featuring gangs, trading, hostile mobs, and redstone mechanics.";
fs.writeFileSync('metadata.json', JSON.stringify(meta, null, 2));

// Update index.html
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/<title>.*?<\/title>/, "<title>Lange: Origins</title>");
fs.writeFileSync('index.html', html);

// Update Landing Page Title if exists in App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(/<h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 mb-6 tracking-tighter">\s*.*?<\/h1>/, `<h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 mb-6 tracking-tighter">\n            LANGE: ORIGINS\n          </h1>`);
fs.writeFileSync('src/App.tsx', app);
