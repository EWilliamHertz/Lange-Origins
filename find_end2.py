lines = open('src/App.tsx').read().split('\n')
for i in range(450, len(lines)):
    if "    );" in lines[i] and "  }" in lines[i+1]:
        print("Found end at", i)
        break
