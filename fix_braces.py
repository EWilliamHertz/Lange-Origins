lines = open('src/App.tsx').read().split('\n')
for i in range(len(lines)):
    if "if (!inventoryOpen && !furnaceOpen && !questLogOpen && !npcDialog) {" in lines[i]:
        del lines[i-6:i] # delete the duplicate above
        break
open('src/App.tsx', 'w').write('\n'.join(lines))
