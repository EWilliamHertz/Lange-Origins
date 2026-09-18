lines = open('src/App.tsx').read().split('\n')
for i in range(1205, 1220):
    if "if (!ability) return null;" in lines[i]:
        lines.insert(i+1, "       const boundKey = Object.entries(keybinds).find(([k, v]) => v === slot.abilityId)?.[0];")
        lines[i+2] = "       return <div data-tooltip={ability.name} className=\"w-full h-full rounded-sm shadow-sm relative group flex items-center justify-center overflow-hidden bg-neutral-900 border border-cyan-500/30\">{ability.icon}{boundKey && <span className=\"absolute top-0 right-0 bg-amber-500 text-black font-black text-[10px] px-1 rounded shadow-md z-10 leading-none\">{boundKey.toUpperCase()}</span>}</div>;"
        break
open('src/App.tsx', 'w').write('\n'.join(lines))
