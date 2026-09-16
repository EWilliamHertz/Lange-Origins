import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/onChange=\{\(e\) => setNickname\(e\.target\.value\)\}/, `onChange={(e) => {
                      const val = e.target.value;
                      setNickname(val);
                      if (activeProfileId) {
                         setProfiles(profiles.map(p => p.id === activeProfileId ? { ...p, name: val } : p));
                      }
                    }}`);

fs.writeFileSync('src/App.tsx', code);
