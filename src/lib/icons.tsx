import { BlockType } from './constants';
import React from 'react';
import { 
  Pickaxe, 
  Sword, 
  Box, 
  Flame, 
  CircleDot, 
  Sprout, 
  Droplets,
  Diamond,
  Gem,
  Hexagon,
  TreePine,
  Trees,
  PocketKnife,
  Wrench,
  Activity,
  DoorClosed,
  Construction,
  Layers,
  SquareDashed,
  LayoutGrid,
  Hand
} from 'lucide-react';

export function getBlockIcon(blockType: BlockType, className: string = "w-full h-full") {
  switch (blockType) {
    case BlockType.WoodPickaxe:
    case BlockType.StonePickaxe:
    case BlockType.IronPickaxe:
      return <Pickaxe className={className} style={{ color: blockType === BlockType.WoodPickaxe ? '#8D6E63' : blockType === BlockType.StonePickaxe ? '#9E9E9E' : '#E0E0E0' }} />;
    case BlockType.WoodSword:
    case BlockType.IronSword:
      return <Sword className={className} style={{ color: blockType === BlockType.WoodSword ? '#A1887F' : '#E0E0E0' }} />;
    case BlockType.WoodHoe:
    case BlockType.StoneHoe:
    case BlockType.IronHoe:
      return <Wrench className={className} style={{ color: blockType === BlockType.WoodHoe ? '#8D6E63' : blockType === BlockType.StoneHoe ? '#9E9E9E' : '#E0E0E0' }} />;
    case BlockType.Torch:
      return <Flame className={className} style={{ color: '#FFC107' }} />;
    case BlockType.Chest:
      return <Box className={className} style={{ color: '#795548' }} />;
    case BlockType.Door:
      return <DoorClosed className={className} style={{ color: '#4E342E' }} />;
    case BlockType.CarrotSeed:
      return <Sprout className={className} style={{ color: '#4CAF50' }} />;
    case BlockType.CarrotCrop1:
    case BlockType.CarrotCrop2:
    case BlockType.CarrotCrop3:
      return <Sprout className={className} style={{ color: '#FF9800' }} />;
    case BlockType.Diamond:
    case BlockType.DiamondOre:
      return <Diamond className={className} style={{ color: '#00BCD4' }} />;
    case BlockType.GoldIngot:
    case BlockType.GoldOre:
      return <CircleDot className={className} style={{ color: '#FFEB3B' }} />;
    case BlockType.IronIngot:
    case BlockType.IronOre:
      return <Hexagon className={className} style={{ color: '#E0E0E0' }} />;
    case BlockType.Coal:
    case BlockType.CoalOre:
      return <CircleDot className={className} style={{ color: '#212121' }} />;
    case BlockType.Water:
      return <Droplets className={className} style={{ color: '#2196F3' }} />;
    case BlockType.Wood:
      return <TreePine className={className} style={{ color: '#5D4037' }} />;
    case BlockType.Leaves:
      return <Trees className={className} style={{ color: '#4CAF50' }} />;
    case BlockType.Platform:
      return <LayoutGrid className={className} style={{ color: '#8D6E63' }} />;
    case BlockType.Grass:
    case BlockType.Dirt:
      return <Layers className={className} style={{ color: '#795548' }} />;
    case BlockType.AdminBrick:
      return <Shield className={className} style={{ color: '#E53935' }} />;
    case BlockType.Fists:
      return <Hand className={className} />;
    default:
      // Fallback is just returning a square with the block color, but as an icon.
      // We will handle default in the main render method.
      return null;
  }
}
