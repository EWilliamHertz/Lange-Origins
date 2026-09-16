import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/onClick=\{\(\) => setCharacterSkin\(skin\.id\)\}/, `onClick={() => {
                          setCharacterSkin(skin.id);
                          if (activeProfileId) {
                             setProfiles(profiles.map(p => p.id === activeProfileId ? { ...p, skin: skin.id } : p));
                          }
                        }}`);

fs.writeFileSync('src/App.tsx', code);
