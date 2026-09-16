import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/serverInput/g, 'joinInput');
code = code.replace(/setServerInput/g, 'setJoinInput');
code = code.replace(/joinServer\(\)/g, 'joinServer(joinInput)');
code = code.replace(/const handleSignOut = \(\) => \{\};/g, ''); // just in case

const handleSignOutStr = `  const handleSignOut = async () => {
    try {
        const { getAuth, signOut } = await import('firebase/auth');
        const auth = getAuth();
        await signOut(auth);
        setAppState('landing');
        setCurrentUser(null);
    } catch (e) {
        console.error(e);
    }
  };
`;

code = code.replace(/const saveProgress = async \(\) => \{/, handleSignOutStr + "\n  const saveProgress = async () => {");

fs.writeFileSync('src/App.tsx', code);
