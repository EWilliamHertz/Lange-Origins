lines = open('server.ts').read().split('\n')
for i in range(len(lines)):
    if "life: 1000 // lives for long" in lines[i]:
        del lines[i+2:i+4]
        break
open('server.ts', 'w').write('\n'.join(lines))
