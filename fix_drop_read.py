lines = open('src/App.tsx').read().split('\n')
for i in range(len(lines)):
    if "const handleDrop = (e: React.DragEvent, targetType: string, targetIndex: number) => {" in lines[i]:
        insert_code = """
    const dragDataStr = e.dataTransfer.getData('text/plain');
    let srcType, srcIndex;
    if (dragDataStr) {
        const parts = dragDataStr.split(',');
        srcType = parts[0];
        srcIndex = parts[1];
        if (srcType !== 'ability') srcIndex = parseInt(srcIndex);
    } else if (draggedItemInfo) {
        srcType = draggedItemInfo.type;
        srcIndex = draggedItemInfo.index;
    } else {
        return;
    }
        """
        lines[i+2] = "" # remove `if (!draggedItemInfo) return;`
        lines.insert(i+1, insert_code)
        
    if "const { type: srcType, index: srcIndex } = draggedItemInfo;" in lines[i]:
        lines[i] = "    // const { type: srcType, index: srcIndex } = draggedItemInfo;"
        break

open('src/App.tsx', 'w').write('\n'.join(lines))
