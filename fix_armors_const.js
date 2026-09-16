import fs from 'fs';
let code = fs.readFileSync('src/lib/constants.ts', 'utf8');

const typeOld = `  IronHelmet = 400,
  IronChestplate = 401,`;
const typeNew = `  IronHelmet = 400,
  IronChestplate = 401,
  GoldHelmet = 407,
  GoldChestplate = 408,
  DiamondHelmet = 409,
  DiamondChestplate = 410,`;
code = code.replace(typeOld, typeNew);

const colorOld = `  [BlockType.IronHelmet]: '#9E9E9E',
  [BlockType.IronChestplate]: '#BDBDBD',`;
const colorNew = `  [BlockType.IronHelmet]: '#9E9E9E',
  [BlockType.IronChestplate]: '#BDBDBD',
  [BlockType.GoldHelmet]: '#FFD54F',
  [BlockType.GoldChestplate]: '#FBC02D',
  [BlockType.DiamondHelmet]: '#4DD0E1',
  [BlockType.DiamondChestplate]: '#00ACC1',`;
code = code.replace(colorOld, colorNew);

const hardOld = `  [BlockType.IronHelmet]: 0,
  [BlockType.IronChestplate]: 0,`;
const hardNew = `  [BlockType.IronHelmet]: 0,
  [BlockType.IronChestplate]: 0,
  [BlockType.GoldHelmet]: 0,
  [BlockType.GoldChestplate]: 0,
  [BlockType.DiamondHelmet]: 0,
  [BlockType.DiamondChestplate]: 0,`;
code = code.replace(hardOld, hardNew);

const nameOld = `  [BlockType.IronHelmet]: 'Iron Helmet',
  [BlockType.IronChestplate]: 'Iron Chestplate',`;
const nameNew = `  [BlockType.IronHelmet]: 'Iron Helmet',
  [BlockType.IronChestplate]: 'Iron Chestplate',
  [BlockType.GoldHelmet]: 'Gold Helmet',
  [BlockType.GoldChestplate]: 'Gold Chestplate',
  [BlockType.DiamondHelmet]: 'Diamond Helmet',
  [BlockType.DiamondChestplate]: 'Diamond Chestplate',`;
code = code.replace(nameOld, nameNew);

fs.writeFileSync('src/lib/constants.ts', code);
