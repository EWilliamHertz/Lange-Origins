lines = open('server.ts').read().split('\n')
for i in range(len(lines)):
    if "app.post('/api/admin/wipe_profiles" in lines[i]:
        del lines[i:]
        break
open('server.ts', 'w').write('\n'.join(lines))
