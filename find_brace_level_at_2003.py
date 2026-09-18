lines = open('src/components/GameCanvas.tsx').read().split('\n')
brace_level = 0
for i in range(112, 2003):
    line = lines[i]
    for char in line:
        if char == '{':
            brace_level += 1
        elif char == '}':
            brace_level -= 1
            
print(f"Brace level right before 2003: {brace_level}")
