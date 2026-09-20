import React, { useEffect, useRef } from 'react';
import { Swords, Shield, Zap, Sparkles, Heart, Crosshair, Wind, Flame, Eye, Compass } from 'lucide-react';
import { PlayerClass, MMO_ABILITIES } from '../lib/abilities';

interface CharacterShowcaseProps {
  selectedClass: PlayerClass;
  characterName?: string;
  race?: string;
  gender?: 'male' | 'female';
}

interface ClassOverviewData {
  title: string;
  role: string;
  summary: string;
  stats: { label: string; value: number; color: string }[];
  particles: { color: string; label: string };
  starterAbilityIds: string[];
}

const CLASS_DETAILS: Record<PlayerClass, ClassOverviewData> = {
  warrior: {
    title: 'Ironclad Warrior',
    role: 'Frontline Tank & Cleave Juggernaut',
    summary: 'Unmatched physical fortitude and devastating close-range crowd control. Absorbs punishing strikes while shattering enemy defenses.',
    stats: [
      { label: 'Health & Fortitude', value: 95, color: 'bg-rose-500' },
      { label: 'Physical Armor', value: 90, color: 'bg-amber-500' },
      { label: 'Burst Damage', value: 60, color: 'bg-orange-500' },
      { label: 'Range', value: 25, color: 'bg-neutral-500' },
      { label: 'Mobility & Rush', value: 70, color: 'bg-emerald-500' },
    ],
    particles: { color: '#ff6622', label: 'Ember Trails' },
    starterAbilityIds: ['slash', 'whirlwind', 'ground_slam', 'battle_shout'],
  },
  mage: {
    title: 'Arcane Elementalist',
    role: 'High Burst & Elemental Devastation',
    summary: 'Master of cataclysmic spellcraft and tactical teleportation. Commands piercing frost to slow enemies and incandescent flames to incinerate foes from afar.',
    stats: [
      { label: 'Health & Fortitude', value: 50, color: 'bg-rose-500' },
      { label: 'Physical Armor', value: 40, color: 'bg-amber-500' },
      { label: 'Burst Damage', value: 100, color: 'bg-purple-500' },
      { label: 'Range', value: 95, color: 'bg-sky-500' },
      { label: 'Mobility & Blink', value: 65, color: 'bg-cyan-500' },
    ],
    particles: { color: '#b344ff', label: 'Arcane Motes' },
    starterAbilityIds: ['fireball', 'frostbolt', 'arcane_blast', 'teleport'],
  },
  archer: {
    title: 'Shadow Ranger',
    role: 'Kiting Specialist & Critical Marksman',
    summary: 'Unrivaled precision, attack speed, and evasive kiting. Punishes enemies at long range with piercing volleys and deadly toxic traps.',
    stats: [
      { label: 'Health & Fortitude', value: 65, color: 'bg-rose-500' },
      { label: 'Physical Armor', value: 55, color: 'bg-amber-500' },
      { label: 'Burst Damage', value: 85, color: 'bg-emerald-500' },
      { label: 'Range', value: 100, color: 'bg-sky-500' },
      { label: 'Mobility & Crit Speed', value: 95, color: 'bg-emerald-400' },
    ],
    particles: { color: '#10b981', label: 'Wind Petals' },
    starterAbilityIds: ['shoot', 'snipe', 'multishot', 'poison_arrow'],
  },
};

export const CharacterShowcasePreview: React.FC<CharacterShowcaseProps> = ({
  selectedClass,
  characterName = 'Hero',
  race = 'Human',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const info = CLASS_DETAILS[selectedClass] || CLASS_DETAILS.warrior;
  const starterAbilities = MMO_ABILITIES.filter(a => info.starterAbilityIds.includes(a.id));

  // Canvas-based interactive animated idle preview with particle trails & weapon shimmer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;
      color: string;
    }

    const particles: Particle[] = [];

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2 + 10;
      const breathe = Math.sin(tick * 0.05) * 3;

      // Draw subtle pedestal shadow
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + 58, 48, 14, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fill();

      // Emit class-specific particle trails
      if (tick % 3 === 0) {
        let pColor = '#ff6622';
        if (selectedClass === 'mage') pColor = Math.random() > 0.5 ? '#b344ff' : '#00e5ff';
        if (selectedClass === 'archer') pColor = Math.random() > 0.5 ? '#10b981' : '#fbbf24';

        particles.push({
          x: centerX + (Math.random() - 0.5) * 40,
          y: centerY + 40 + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -0.8 - Math.random() * 1.2,
          life: 0,
          maxLife: 40 + Math.random() * 25,
          size: 2 + Math.random() * 3,
          color: pColor,
        });
      }

      // Update & draw particles behind character
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        const progress = p.life / p.maxLife;
        const alpha = Math.max(0, 1 - progress);

        ctx.save();
        ctx.globalAlpha = alpha * 0.8;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - progress * 0.4), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (p.life >= p.maxLife) particles.splice(i, 1);
      }

      // Draw Character Body Base
      ctx.save();
      ctx.translate(centerX, centerY + breathe);

      // Cape / Aura Backing
      if (selectedClass === 'mage') {
        ctx.fillStyle = '#4c1d95';
        ctx.beginPath();
        ctx.moveTo(-18, 0);
        ctx.lineTo(-24, 45);
        ctx.lineTo(24, 45);
        ctx.lineTo(18, 0);
        ctx.closePath();
        ctx.fill();
      }

      // Torso / Armor
      let armorColor = '#475569'; // Warrior slate steel
      if (selectedClass === 'mage') armorColor = '#6d28d9'; // Mage royal robe
      if (selectedClass === 'archer') armorColor = '#15803d'; // Archer hunter leather

      ctx.fillStyle = armorColor;
      ctx.fillRect(-14, -8, 28, 36);

      // Armor reflection shimmer line
      const shimmerPos = ((tick * 1.5) % 80) - 20;
      if (shimmerPos > -14 && shimmerPos < 14) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(shimmerPos, -8, 4, 36);
      }

      // Belt & Buckle
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-14, 18, 28, 6);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-4, 17, 8, 8);

      // Legs
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-12, 28, 10, 24);
      ctx.fillRect(2, 28, 10, 24);
      // Boots
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-14, 46, 12, 8);
      ctx.fillRect(2, 46, 12, 8);

      // Head / Helmet
      ctx.fillStyle = '#fed7aa'; // Skin
      ctx.fillRect(-10, -32, 20, 22);

      // Hair / Helmet top
      if (selectedClass === 'warrior') {
        ctx.fillStyle = '#64748b'; // Iron helm
        ctx.fillRect(-12, -36, 24, 12);
        ctx.fillStyle = '#f59e0b'; // Gold visor crest
        ctx.fillRect(-6, -38, 12, 4);
      } else if (selectedClass === 'mage') {
        ctx.fillStyle = '#7c3aed'; // Wizard cowl
        ctx.beginPath();
        ctx.moveTo(-14, -20);
        ctx.lineTo(0, -44);
        ctx.lineTo(14, -20);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = '#065f46'; // Ranger hood
        ctx.fillRect(-12, -36, 24, 14);
      }

      // Eyes
      ctx.fillStyle = selectedClass === 'mage' ? '#38bdf8' : '#0f172a';
      ctx.fillRect(-6, -22, 3, 3);
      ctx.fillRect(3, -22, 3, 3);

      // Weapon Idle & Sway
      const weaponTilt = Math.sin(tick * 0.08) * 0.15;
      ctx.save();
      ctx.translate(18, 8);
      ctx.rotate(weaponTilt);

      if (selectedClass === 'warrior') {
        // Greatsword
        ctx.fillStyle = '#94a3b8'; // Blade
        ctx.fillRect(-2, -35, 6, 45);
        ctx.fillStyle = '#e2e8f0'; // Edge highlight
        ctx.fillRect(2, -35, 2, 45);
        ctx.fillStyle = '#f59e0b'; // Crossguard
        ctx.fillRect(-7, 8, 16, 5);
        ctx.fillStyle = '#78350f'; // Grip
        ctx.fillRect(-1, 13, 4, 10);
      } else if (selectedClass === 'mage') {
        // Arcane Staff
        ctx.fillStyle = '#78350f'; // Wood pole
        ctx.fillRect(-2, -30, 4, 60);
        // Crystal orb
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, -32, 8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Recurve Bow
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(-5, 0, 24, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.stroke();
        // Bowstring
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(10, -20);
        ctx.lineTo(10, 20);
        ctx.stroke();
      }

      ctx.restore();
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [selectedClass]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 bg-neutral-950/80 backdrop-blur-md rounded-2xl border border-amber-500/30 p-5 shadow-2xl">
      {/* 3D / Animated Sprite Canvas Showcase */}
      <div className="md:col-span-5 flex flex-col items-center justify-between bg-gradient-to-b from-neutral-900/90 to-neutral-950 p-4 rounded-xl border border-white/10 relative overflow-hidden">
        {/* Glow ambient circle */}
        <div 
          className="absolute -top-12 -left-12 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ backgroundColor: info.particles.color }}
        />

        <div className="w-full flex items-center justify-between z-10">
          <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
            <Sparkles size={13} /> {info.particles.label}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-neutral-300">
            {race}
          </span>
        </div>

        {/* Animated Canvas */}
        <div className="relative my-2">
          <canvas
            ref={canvasRef}
            width={180}
            height={180}
            className="w-44 h-44 drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]"
          />
        </div>

        {/* Character Name & Role Stamp */}
        <div className="text-center z-10 w-full pt-3 border-t border-white/10">
          <h3 className="text-lg font-black text-white tracking-wide flex items-center justify-center gap-1.5">
            {characterName}
          </h3>
          <p className="text-xs font-bold text-amber-300/90 mt-0.5">{info.title}</p>
          <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30">
            {info.role}
          </span>
        </div>
      </div>

      {/* Class Archetype Overview & Starter Abilities Panel */}
      <div className="md:col-span-7 flex flex-col gap-4">
        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Compass size={16} /> Archetype Profile
            </h4>
            <span className="text-xs text-neutral-400">Combat Specialization</span>
          </div>
          <p className="text-xs text-neutral-300 mt-1.5 leading-relaxed bg-neutral-900/50 p-3 rounded-xl border border-neutral-800">
            {info.summary}
          </p>
        </div>

        {/* Attribute Distribution Ratings */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            Combat Rating Matrix
          </span>
          <div className="grid grid-cols-1 gap-1.5">
            {info.stats.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs gap-3">
                <span className="text-neutral-400 text-[11px] w-32 shrink-0">{s.label}</span>
                <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${s.color} rounded-full transition-all duration-500`}
                    style={{ width: `${s.value}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono font-bold text-neutral-300 w-8 text-right">
                  {s.value}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Starter Ability Previews */}
        <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Zap size={13} /> Starter Ability Arsenal
          </span>
          <div className="grid grid-cols-2 gap-2">
            {starterAbilities.map(ab => (
              <div 
                key={ab.id}
                className="p-2.5 rounded-xl bg-neutral-900/70 border border-neutral-800 flex items-start gap-2.5 hover:border-amber-500/30 transition-colors"
              >
                <div className="p-1.5 rounded-lg bg-neutral-950 border border-neutral-700 text-amber-400 shrink-0">
                  {ab.icon}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white truncate">{ab.name}</span>
                  <p className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">{ab.desc}</p>
                  <div className="flex items-center gap-2 text-[9px] font-mono text-neutral-500 mt-1">
                    <span>CD: {ab.cd}s</span>
                    {ab.cost > 0 && <span className="text-sky-400">{ab.cost} Mana</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
