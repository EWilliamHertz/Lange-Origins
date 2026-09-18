lines = open('src/App.tsx').read().split('\n')
for i, line in enumerate(lines):
    if "setQuests(prev => [...prev," in line and "q6" in lines[i+1]:
        lines[i] = "       setQuests(prev => { if (prev.find(q => q.id === 'q6')) return prev; return [...prev, "
        lines[i+3] = "       ]});"
        break
open('src/App.tsx', 'w').write('\n'.join(lines))
