lines = open('src/App.tsx').read().split('\n')
for i in range(len(lines)):
    if "const [joinInput, setJoinInput] = useState('public-lobby');" in lines[i]:
        lines[i] = "  const [joinInput, setJoinInput] = useState(window.location.hash ? window.location.hash.replace('#', '') : 'public-lobby');"
        break
open('src/App.tsx', 'w').write('\n'.join(lines))
