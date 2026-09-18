lines = open('src/components/GameCanvas.tsx').read().split('\n')
for i in range(len(lines)):
    if "        } else if (proj.type === 'fireball') {" in lines[i]:
        insert_code = """
        } else if (proj.type === 'frostbolt') {
          ctx.fillStyle = '#4DD0E1'; // cyan
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.fill();
        } else if (proj.type === 'snipe_arrow') {
          ctx.fillStyle = '#D84315'; // deep orange
          ctx.fillRect(-8, -2, 16, 4);
          ctx.fillStyle = '#FFFFFF'; // white head
          ctx.beginPath();
          ctx.moveTo(8, -2);
          ctx.lineTo(14, 0);
          ctx.lineTo(8, 2);
          ctx.fill();
        } else if (proj.type === 'trap') {
          ctx.fillStyle = '#607D8B'; // blue grey
          ctx.fillRect(-6, 4, 12, 4);
          ctx.fillStyle = '#FF5252'; // red center
          ctx.fillRect(-2, 3, 4, 2);
        """
        lines.insert(i, insert_code)
        break
open('src/components/GameCanvas.tsx', 'w').write('\n'.join(lines))
