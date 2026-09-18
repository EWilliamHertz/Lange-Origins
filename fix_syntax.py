lines = open('src/App.tsx').read().split('\n')
for i in range(2200, 2350):
    if "''}\">" in lines[i]:
        lines[i] = lines[i].replace("''}\">", "''}`>")
    if "'z-20'}\">" in lines[i]:
        lines[i] = lines[i].replace("'z-20'}\">", "'z-20'}`>")

open('src/App.tsx', 'w').write('\n'.join(lines))
