lines = open('src/App.tsx.backup').read().split('\n')
for i in range(len(lines)):
    if lines[i] == "}":
        pass # we'll find the last } at line 3896

open('src/App.tsx', 'w').write('\n'.join(lines[:3897]))
