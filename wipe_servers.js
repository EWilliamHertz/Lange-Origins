import fs from 'fs';

// I need to wipe all servers so new biomes appear!
const req = await fetch('http://localhost:3000/api/admin/wipe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ewilliamhe@gmail.com' })
});

console.log(await req.text());
