lines = open('src/components/GameCanvas.tsx').read().split('\n')
start = 872

brace_level = 0
for i in range(start, 1125):
    line = lines[i]
    for char in line:
        if char == '{':
            brace_level += 1
        elif char == '}':
            brace_level -= 1
    if i >= 1110:
        print(f"Line {i+1}: {line} (level after line = {brace_level})")
