lines = open('src/App.tsx').read().split('\n')
for i in range(2320, 2350):
    if "key={index}" in lines[i]:
        lines.insert(i+1, "                onDragOver={handleDragOver}")
        lines.insert(i+2, "                onDrop={(e) => handleDrop(e, 'hotbar', index)}")
        break
open('src/App.tsx', 'w').write('\n'.join(lines))
