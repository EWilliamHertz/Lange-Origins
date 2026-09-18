lines = open('src/App.tsx').read().split('\n')
for i in range(len(lines)):
    if "socket.on('disconnect'" in lines[i]:
        insert = """
      socket.on('party_ready_check', (data: { instanceId: string }) => {
          setReadyCheck(data);
      });
      socket.on('instance_joined', (data: { instanceId: string }) => {
          setReadyCheck(null);
          setInstancesOpen(false);
          joinServer(data.instanceId);
      });
      socket.on('ready_check_cancelled', () => {
          setReadyCheck(null);
          setNotifications(prev => [...prev, { id: Math.random().toString(), type: 'system', senderId: 'System', senderName: 'System', msg: 'Ready check cancelled.', timestamp: Date.now() }]);
      });
"""
        lines.insert(i, insert)
        break
open('src/App.tsx', 'w').write('\n'.join(lines))
