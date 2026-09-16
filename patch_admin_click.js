import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `        if (action === 'Wipe World Data') {
          const roomToWipe = window.prompt('Enter the name of the server/room to wipe (leave blank for public-lobby):') || 'public-lobby';
          if (!window.confirm(\`Are you sure you want to wipe "\${roomToWipe}"? This cannot be undone.\`)) return;
          
          const res = await fetch('/api/admin/wipe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUser.email, roomId: roomToWipe })
          });
          const data = await res.json();
          if (data.success) {
            alert(\`World "\${roomToWipe}" wiped successfully!\`);
          } else {
            alert('Failed to wipe world: ' + data.error);
          }
        }`;

code = code.replace(/        if \(action === 'Wipe World Data'\) \{[\s\S]*?\} else if \(action === 'Manage Players'\) \{/, replacement + " else if (action === 'Manage Players') {");

fs.writeFileSync('src/App.tsx', code);
