lines = open('src/components/GameCanvas.tsx').read().split('\n')
for i in range(len(lines)):
    if "const px = (mob as any).x - TILE_SIZE / 2;" in lines[i]:
        lines[i] = "        const px = (mob as any).x - 12;"
    if "const py = (mob as any).y - TILE_SIZE;" in lines[i]:
        lines[i] = "        const py = (mob as any).y - 24;"
        lines[i+1] = "        if (mx >= px && mx <= px + 48 && my >= py && my <= py + 48) {"

open('src/components/GameCanvas.tsx', 'w').write('\n'.join(lines))
