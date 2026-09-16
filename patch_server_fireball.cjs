const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "life: data.type === 'grenade' ? 60 : (data.type === 'magic' ? 80 : 40),",
  "life: data.type === 'grenade' ? 60 : (data.type === 'fireball' ? 80 : 40),"
);

code = code.replace(
  "damage: data.type === 'bullet' ? 15 : (data.type === 'arrow' ? 8 : (data.type === 'magic' ? 25 : 0))",
  "damage: data.type === 'bullet' ? 15 : (data.type === 'arrow' ? 8 : (data.type === 'fireball' ? 30 : 0))"
);

code = code.replace(
  "else if (p.type !== 'magic') p.vy += 0.1;",
  "else if (p.type !== 'fireball') p.vy += 0.1;"
);

fs.writeFileSync('server.ts', code);
console.log('Server fireball patched.');
