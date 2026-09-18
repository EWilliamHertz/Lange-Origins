lines = open('src/components/GameCanvas.tsx').read().split('\n')
for i in range(865, 885):
    if "isPickaxe ? (sel === BlockType.IronPickaxe ? 5 : 3)" in lines[i]:
        lines[i+1] = "                               : isFist ? 3 : 1;"
        break
open('src/components/GameCanvas.tsx', 'w').write('\n'.join(lines))
