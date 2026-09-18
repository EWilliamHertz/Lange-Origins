lines = open('src/App.tsx').read().split('\n')
for i in range(1196, 1220):
    if "if (typeof slot === 'number') {" in lines[i]:
        lines.insert(i, "    if (typeof slot === 'object' && slot.isAbility) {")
        lines.insert(i+1, "       const ability = [{id: 'slash', name: 'Slash', desc: 'Melee attack.', req: 0, cost: 0, cd: 3, icon: <Sword className=\"w-full h-full p-1 text-cyan-400 drop-shadow-md\" />}, {id: 'fireball', name: 'Fireball', desc: 'Shoot a flaming projectile.', req: 5, cost: 10, cd: 5, icon: <Flame className=\"w-full h-full p-1 text-cyan-400 drop-shadow-md\" />}, {id: 'heal', name: 'Heal', desc: 'Restore 20 HP.', req: 3, cost: 20, cd: 10, icon: <Heart className=\"w-full h-full p-1 text-cyan-400 drop-shadow-md\" />}].find(a => a.id === slot.abilityId);")
        lines.insert(i+2, "       if (!ability) return null;")
        lines.insert(i+3, "       return <div data-tooltip={ability.name} className=\"w-full h-full rounded-sm shadow-sm relative group flex items-center justify-center overflow-hidden bg-neutral-900 border border-cyan-500/30\">{ability.icon}</div>;")
        lines.insert(i+4, "    }")
        break
open('src/App.tsx', 'w').write('\n'.join(lines))
