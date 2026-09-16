import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/m\.vy = -6;\n\s*\/\/ knockback away from hit center, or default to facing direction if exact same spot/, 
`m.vy = -6;
              m.vx = data.facingRight ? 8 : -8;`);

fs.writeFileSync('server.ts', code);
