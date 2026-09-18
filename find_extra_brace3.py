lines = open('src/components/GameCanvas.tsx').read().split('\n')
brace_level = 0
for i in range(112, 2000):
    line = lines[i]
    for char in line:
        if char == '{':
            brace_level += 1
        elif char == '}':
            brace_level -= 1
    
    if i > 115 and brace_level == 0:
        print(f"Brace level became 0 at line {i+1}: {line}")
        break
