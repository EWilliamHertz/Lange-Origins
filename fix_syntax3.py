lines = open('src/App.tsx').read().split('\n')
for i in range(len(lines)):
    if "const num = parseInt(e.key);" in lines[i]:
        # found the first one
        if "const num = parseInt(e.key);" in lines[i+4]:
            del lines[i+4:i+10] # remove the duplicate hotbar swap logic which should only be for inventory open
        break
open('src/App.tsx', 'w').write('\n'.join(lines))
