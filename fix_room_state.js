import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/chests: Record<string, any\[\]>;\n\s*createdAt: number;\n\s*\}>/, 
`chests: Record<string, any[]>;
    createdAt: number;
    gangs: Record<string, any>;
    trades: Record<string, any>;
    projectiles: Record<string, any>;
    timeOfDay: number;
  }>`);

code = code.replace(/chests: \{\},\n\s*createdAt: Date\.now\(\)\n\s*\}/, 
`chests: {},
      createdAt: Date.now(),
      gangs: {},
      trades: {},
      projectiles: {},
      timeOfDay: 0
    }`);

code = code.replace(/chests: \{\},\n\s*createdAt: Date\.now\(\)\n\s*\};\n\s*\}/, 
`chests: {},
          createdAt: Date.now(),
          gangs: {},
          trades: {},
          projectiles: {},
          timeOfDay: 0
        };
      }`);

fs.writeFileSync('server.ts', code);
