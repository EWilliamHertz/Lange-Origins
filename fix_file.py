lines = open('src/App.tsx.backup').read().split('\n')
for i in range(len(lines)):
    if lines[i].startswith("import React, ") and i > 100:
        original = lines[i:]
        open('src/App.tsx', 'w').write('\n'.join(original))
        print("Restored original file.")
        break
