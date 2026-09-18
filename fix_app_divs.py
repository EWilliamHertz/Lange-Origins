lines = open('src/App.tsx').read().split('\n')
for i in range(len(lines)):
    if ") : (" in lines[i] and "Publish Your World" in lines[i+3]:
        lines.insert(i, "                    </div>")
        break
open('src/App.tsx', 'w').write('\n'.join(lines))
