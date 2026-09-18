lines = open('src/components/GameCanvas.tsx').read().split('\n')
for i in range(len(lines)):
    if "socket.on('damage_indicator', (data: { id: string, x: number, y: number, damage: number" in lines[i]:
        lines[i] = "    socket.on('damage_indicator', (data: { id: string, x: number, y: number, damage: number, isPlayer?: boolean }) => {"
        for j in range(i+1, i+15):
            if "life: 0," in lines[j]:
                lines.insert(j+1, "        color: data.isPlayer ? '#FF0000' : '#FFD700',")
                break
        break
open('src/components/GameCanvas.tsx', 'w').write('\n'.join(lines))
