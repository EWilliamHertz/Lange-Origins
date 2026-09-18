lines = open('src/App.tsx').read().split('\n')
for i in range(len(lines)):
    if "                           {MMO_ABILITIES.filter(a => a.class === playerClass).map(ability => {" in lines[i]:
        del lines[i+1:i+3] # delete the leftover array definition
        break

for i in range(len(lines)):
    if "{!unlocked && <p className=\"text-xs text-red-400 mt-1 font-bold\">Requires Int {ability.req}</p>}" in lines[i]:
        lines[i] = "                                       {!unlocked && <p className=\"text-xs text-red-400 mt-1 font-bold\">Requires {ability.class === 'warrior' ? 'Str' : ability.class === 'archer' ? 'Dex' : 'Int'} {ability.req}</p>}"
        break
open('src/App.tsx', 'w').write('\n'.join(lines))
