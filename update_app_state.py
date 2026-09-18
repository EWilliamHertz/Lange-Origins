lines = open('src/App.tsx').read().split('\n')
for i in range(len(lines)):
    if "const [merchantOpen, setMerchantOpen] = useState(false);" in lines[i]:
        insert = """
  const [instancesOpen, setInstancesOpen] = useState(false);
  const [readyCheck, setReadyCheck] = useState<{ instanceId: string } | null>(null);
"""
        lines.insert(i, insert)
        break
open('src/App.tsx', 'w').write('\n'.join(lines))

lines = open('src/App.tsx').read().split('\n')
for i in range(len(lines)):
    if "if (e.key.toLowerCase() === 'q') {" in lines[i]:
        insert = """
      if (e.key.toLowerCase() === 'i') {
        if (!inventoryOpen && !furnaceOpen && !isChatOpen) {
          setInstancesOpen(prev => !prev);
        }
        return;
      }
"""
        lines.insert(i, insert)
        break
open('src/App.tsx', 'w').write('\n'.join(lines))
