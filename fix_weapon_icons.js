import fs from 'fs';
let code = fs.readFileSync('src/lib/icons.tsx', 'utf8');

code = code.replace(/import \{/, "import { Bomb, LocateFixed, CircleDot,\n ");

const newIcons = `
    case BlockType.TNT:
      return <Bomb className={className} style={{ color: '#D32F2F' }} />;
    case BlockType.Gun:
      return <LocateFixed className={className} style={{ color: '#424242' }} />;
    case BlockType.Bullet:
      return <CircleDot className={className} style={{ color: '#FFC107' }} />;
    case BlockType.Grenade:
      return <Bomb className={className} style={{ color: '#2E7D32' }} />;
`;

code = code.replace(/case BlockType\.Wire:/, newIcons + "\n    case BlockType.Wire:");

fs.writeFileSync('src/lib/icons.tsx', code);
