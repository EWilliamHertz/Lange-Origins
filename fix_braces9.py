lines = open('src/components/GameCanvas.tsx').read().split('\n')
brace_level = 0
paren_level = 0
for i in range(0, len(lines)):
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
    if paren_level == 0 and i > 500 and i < 2057:
        print(f"Hit 0 at {i+1}: brace:{brace_level} {line}")
