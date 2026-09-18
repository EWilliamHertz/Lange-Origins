lines = open('src/App.tsx').read().split('\n')
for i in range(450, len(lines)):
    if "const countAmmo = (type: number) => {" in lines[i]:
        print("Found countAmmo at line", i)
        break
