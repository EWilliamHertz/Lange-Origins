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
    if paren_level < 0 or brace_level < 0:
        print(f"Error at {i+1}: brace:{brace_level} paren:{paren_level} {line}")
        break
print(f"Final: brace:{brace_level} paren:{paren_level}")
