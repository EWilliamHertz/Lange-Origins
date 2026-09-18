lines = open('src/App.tsx').read().split('\n')
for i in range(len(lines)):
    if "setServerName(srv);" in lines[i]:
        lines.insert(i+1, "    window.location.hash = srv;")
        break
open('src/App.tsx', 'w').write('\n'.join(lines))
