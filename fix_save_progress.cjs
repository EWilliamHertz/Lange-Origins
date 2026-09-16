const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// saving logic
code = code.replace(
  "kills: latest.kills,",
  "kills: latest.kills,\n        xp: latest.xp,\n        level: latest.level,\n        skillPoints: latest.skillPoints,\n        skills: JSON.stringify(latest.skills),"
);

// loading logic (when choosing a profile)
code = code.replace(
  "if (active.kills !== undefined) setKills(active.kills);",
  "if (active.kills !== undefined) setKills(active.kills);\n              if (active.xp !== undefined) setXp(active.xp);\n              if (active.level !== undefined) setLevel(active.level);\n              if (active.skillPoints !== undefined) setSkillPoints(active.skillPoints);\n              if (active.skills) setSkills(JSON.parse(active.skills));"
);

// loading logic (when creating new profile)
code = code.replace(
  "kills: 0,",
  "kills: 0,\n                         xp: 0,\n                         level: 1,\n                         skillPoints: 0,\n                         skills: JSON.stringify({ vitality: 0, speed: 0, strength: 0 }),"
);
code = code.replace(
  "setHealth(20);",
  "setHealth(20);\n                      setKills(0);\n                      setXp(0);\n                      setLevel(1);\n                      setSkillPoints(0);\n                      setSkills({ vitality: 0, speed: 0, strength: 0 });"
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed load/save for XP and skills');
