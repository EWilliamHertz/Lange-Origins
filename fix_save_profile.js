import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const profileButtons = `
                 <button
                   onClick={async () => {
                      if (!currentUser || !activeProfileId) return;
                      const updatedProfile = profiles.find(p => p.id === activeProfileId);
                      if (!updatedProfile) return;
                      
                      const newProfiles = [...profiles];
                      const idx = newProfiles.findIndex(p => p.id === activeProfileId);
                      newProfiles[idx] = { ...updatedProfile, name: nickname, skin: characterSkin, updatedAt: Date.now() };
                      setProfiles(newProfiles);
                      
                      import('firebase/firestore').then(({ setDoc, doc, serverTimestamp }) => {
                          setDoc(doc(db, 'users', currentUser.uid, 'profiles', activeProfileId), { name: nickname, skin: characterSkin, updatedAt: serverTimestamp() }, { merge: true });
                      });
                   }}
                   className="px-4 py-2 rounded-xl text-sm font-bold border border-blue-500/30 bg-blue-900/20 text-blue-400 hover:bg-blue-800/40 transition-all flex items-center gap-1"
                 >
                   Save Profile
                 </button>
                 <button
`;

code = code.replace(/<button\n\s*onClick=\{async \(\) => \{\n\s*if \(\!currentUser\) return;\n\s*const newId = 'prof_/, profileButtons + "\n                   onClick={async () => {\n                      if (!currentUser) return;\n                      const newId = 'prof_");

fs.writeFileSync('src/App.tsx', code);
