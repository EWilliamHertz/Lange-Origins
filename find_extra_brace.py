lines = open('src/components/GameCanvas.tsx').read().split('\n')
paren_level = 0
for i in range(530, 2000):
    line = lines[i]
    for char in line:
        if char == '(':
            paren_level += 1
        elif char == ')':
            paren_level -= 1
    
    # Ignore false positives inside strings
    if "dtTxt.color.replace(')'," in line:
        paren_level += 1 # compensation

    if paren_level == 0:
        print(f"Paren level became 0 at line {i+1}: {line}")
        break
