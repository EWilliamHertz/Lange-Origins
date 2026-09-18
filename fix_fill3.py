lines = open('src/components/GameCanvas.tsx').read().split('\n')

for i in range(len(lines)):
    if "if (healAnim > 0) {" in lines[i]:
        # Need to add } after ctx.fill() in this block
        for j in range(i, i+10):
            if "ctx.fill();" in lines[j]:
                lines.insert(j+1, "        }")
                break
        break

open('src/components/GameCanvas.tsx', 'w').write('\n'.join(lines))
