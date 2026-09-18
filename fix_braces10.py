lines = open('src/components/GameCanvas.tsx').read().split('\n')
brace_level = 0
paren_level = 0
for i in range(530, 1973):
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
    if paren_level == 0:
        print(f"Hit 0 at {i+1}: {line}")
        break
