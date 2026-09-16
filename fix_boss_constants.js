import fs from 'fs';
let code = fs.readFileSync('src/lib/constants.ts', 'utf8');

// Add BossBlock types and Boss mob
const constOld = `  IronChestplate = 401,
  Gunpowder = 402,
  Bone = 403
}`;
const constNew = `  IronChestplate = 401,
  Gunpowder = 402,
  Bone = 403,
  CorruptedStone = 35,
  CorruptedGrass = 36,
  BossGolem = 404,
  BossDrop = 405,
  MagicStaff = 406
}`;
code = code.replace(constOld, constNew);

const colorOld = `  [BlockType.Bone]: '#FFFFFF'
};`;
const colorNew = `  [BlockType.Bone]: '#FFFFFF',
  [BlockType.CorruptedStone]: '#311B92',
  [BlockType.CorruptedGrass]: '#4A148C',
  [BlockType.BossGolem]: '#1A237E',
  [BlockType.BossDrop]: '#FFD700',
  [BlockType.MagicStaff]: '#9C27B0'
};`;
code = code.replace(colorOld, colorNew);

const solidOld = `  BlockType.Farmland, BlockType.Chest]);`;
const solidNew = `  BlockType.Farmland, BlockType.Chest, BlockType.CorruptedStone, BlockType.CorruptedGrass]);`;
code = code.replace(solidOld, solidNew);

const hardOld = `  [BlockType.Bone]: 0
};`;
const hardNew = `  [BlockType.Bone]: 0,
  [BlockType.CorruptedStone]: 15,
  [BlockType.CorruptedGrass]: 10,
  [BlockType.BossGolem]: 0,
  [BlockType.BossDrop]: 0,
  [BlockType.MagicStaff]: 0
};`;
code = code.replace(hardOld, hardNew);

const nameOld = `  [BlockType.Bone]: 'Bone'
};`;
const nameNew = `  [BlockType.Bone]: 'Bone',
  [BlockType.CorruptedStone]: 'Corrupted Stone',
  [BlockType.CorruptedGrass]: 'Corrupted Grass',
  [BlockType.BossGolem]: 'Giant Golem',
  [BlockType.BossDrop]: 'Boss Relic',
  [BlockType.MagicStaff]: 'Magic Staff'
};`;
code = code.replace(nameOld, nameNew);

fs.writeFileSync('src/lib/constants.ts', code);
