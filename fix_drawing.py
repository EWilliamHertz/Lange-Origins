lines = open('src/components/GameCanvas.tsx').read().split('\n')

start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if "else if (isPickaxe) {" in line:
        start_idx = i
        break

if start_idx != -1:
    for i in range(start_idx, len(lines)):
        if "ctx.restore();" in lines[i]:
            end_idx = i
            break

print(start_idx, end_idx)

if start_idx != -1 and end_idx != -1:
    # Delete from start_idx to end_idx - 1
    new_lines = lines[:start_idx] + lines[end_idx:]
    open('src/components/GameCanvas.tsx', 'w').write('\n'.join(new_lines))
    print("Fixed!")
