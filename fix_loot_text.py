lines = open('src/components/GameCanvas.tsx').read().split('\n')
for i in range(1750, 1790):
    if "         ctx.restore();" in lines[i]:
        insert_code = """
         ctx.fillStyle = '#FFFFFF';
         ctx.font = '10px unifont';
         ctx.textAlign = 'center';
         ctx.shadowColor = '#000000';
         ctx.shadowBlur = 2;
         ctx.fillText(BlockNames[item.type as BlockType] || 'Item', item.x + 8, item.y - 12);
         ctx.shadowBlur = 0;
        """
        lines.insert(i+1, insert_code)
        break
open('src/components/GameCanvas.tsx', 'w').write('\n'.join(lines))
