lines = open('src/App.tsx').read().split('\n')
for i in range(len(lines)):
    if "import {" in lines[i] and "lucide-react" in lines[i]:
        if "Compass" not in lines[i]:
            lines[i] = lines[i].replace("}", ", Compass, LayoutGrid }")
        break
open('src/App.tsx', 'w').write('\n'.join(lines))
