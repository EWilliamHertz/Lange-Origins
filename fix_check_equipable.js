import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const isEquipableFn = `
const checkEquipable = (type: number) => (type >= 100 && type <= 109) || type === 302 || type === 400 || type === 401;
`;

if (!code.includes('const checkEquipable =')) {
   code = code.replace(/export default function App\(\) \{/, isEquipableFn + "\nexport default function App() {");
   fs.writeFileSync('src/App.tsx', code);
   console.log("Added checkEquipable to App.tsx");
} else {
   console.log("checkEquipable already exists in App.tsx");
}
