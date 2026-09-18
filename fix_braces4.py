lines = open('src/components/GameCanvas.tsx').read().split('\n')
brace_level = 0
paren_level = 0
for i in range(0, 100):
    line = lines[i]
    for char in line:
        if char == '{':
            brace_level += 1
        elif char == '}':
            brace_level -= 1
        elif char == '(':
            paren_level += 1
        elif char == ')':
            paren_level -= 1
    if i > 50 and i < 100:
        print(f"{i+1}: {paren_level} {line}")
