import { BlockType } from './constants';
import React from 'react';
import { Settings2, ArrowRightCircle, Rocket, Crosshair, Cpu, Bomb, LocateFixed, CircleDot,
  Store, Pickaxe, Sword, Box, Flame, Sprout, Droplets, Diamond, Gem, Hexagon,
  TreePine, Trees, PocketKnife, Wrench, Activity, DoorClosed, Construction,
  Layers, SquareDashed, LayoutGrid, Hand, Shield, Anchor } from 'lucide-react';

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
      return <Gem className={className} style={{ color: '#00BCD4' }} />;
    case BlockType.DiamondOre:
      return (
        <svg viewBox="0 0 24 24" className={className} fill="#757575">
           <rect x="2" y="2" width="20" height="20" rx="2" />
           <circle cx="6" cy="6" r="2" fill="#00BCD4" />
           <circle cx="16" cy="10" r="2.5" fill="#00BCD4" />
           <circle cx="10" cy="16" r="2" fill="#00BCD4" />
        </svg>
      );
    case BlockType.GoldIngot:
      return (
        <svg viewBox="0 0 24 24" className={className} fill="#FBC02D" stroke="#F57F17" strokeWidth="1.5">
           <path d="M6 14 L8 10 L18 10 L16 14 Z" />
           <path d="M6 14 L16 14 L16 16 L6 16 Z" fill="#F57F17" stroke="none" />
        </svg>
      );
    case BlockType.GoldOre:
      return (
        <svg viewBox="0 0 24 24" className={className} fill="#757575">
           <rect x="2" y="2" width="20" height="20" rx="2" />
           <circle cx="7" cy="7" r="2" fill="#FBC02D" />
           <circle cx="15" cy="11" r="2.5" fill="#FBC02D" />
           <circle cx="9" cy="17" r="2.5" fill="#FBC02D" />
        </svg>
      );
    case BlockType.IronIngot:
      return (
        <svg viewBox="0 0 24 24" className={className} fill="#E0E0E0" stroke="#9E9E9E" strokeWidth="1.5">
           <path d="M6 14 L8 10 L18 10 L16 14 Z" />
           <path d="M6 14 L16 14 L16 16 L6 16 Z" fill="#9E9E9E" stroke="none" />
        </svg>
      );
    case BlockType.IronOre:
      return (
        <svg viewBox="0 0 24 24" className={className} fill="#757575">
           <rect x="2" y="2" width="20" height="20" rx="2" />
           <circle cx="6" cy="8" r="2.5" fill="#E0E0E0" />
           <circle cx="16" cy="7" r="2" fill="#E0E0E0" />
           <circle cx="12" cy="15" r="3" fill="#E0E0E0" />
        </svg>
      );
    case BlockType.Coal:
      return (
        <svg viewBox="0 0 24 24" className={className} fill="#212121" stroke="#000000" strokeWidth="1">
           <path d="M7 14 L10 8 L16 10 L18 15 L12 19 Z" />
        </svg>
      );
    case BlockType.CoalOre:
      return (
        <svg viewBox="0 0 24 24" className={className} fill="#757575">
           <rect x="2" y="2" width="20" height="20" rx="2" />
           <circle cx="8" cy="6" r="2" fill="#212121" />
           <circle cx="15" cy="14" r="3" fill="#212121" />
           <circle cx="6" cy="16" r="2.5" fill="#212121" />
        </svg>
      );

    case BlockType.Water:
      return <Droplets className={className} style={{ color: '#2196F3' }} />;
    case BlockType.Wood:
      return <TreePine className={className} style={{ color: '#5D4037' }} />;
    case BlockType.Leaves:
      return <Trees className={className} style={{ color: '#4CAF50' }} />;
    case BlockType.Bow:
      return <Crosshair className={className} style={{ color: '#5D4037' }} />;
    case BlockType.Arrow:
      return <ArrowRightCircle className={className} style={{ color: '#E0E0E0' }} />;
    
    case BlockType.TNT:
      return <Bomb className={className} style={{ color: '#D32F2F' }} />;
    case BlockType.GrapplingHook:
      return <Anchor className={className} style={{ color: '#455A64' }} />;
    case BlockType.Gun:
      return <LocateFixed className={className} style={{ color: '#424242' }} />;
    case BlockType.Bullet:
      return <CircleDot className={className} style={{ color: '#FFC107' }} />;
    case BlockType.Grenade:
      return <Bomb className={className} style={{ color: '#2E7D32' }} />;

    case BlockType.Wire:
      return <Cpu className={className} style={{ color: '#D50000' }} />;
    case BlockType.PressurePlate:
      return <Settings2 className={className} style={{ color: '#616161' }} />;
    case BlockType.DoorOpen:
      return <DoorClosed className={className} style={{ color: '#795548', opacity: 0.5 }} />;
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
