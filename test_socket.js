import { io } from 'socket.io-client';
const socket = io('http://localhost:3000', { transports: ['websocket'] });
socket.on('connect', () => {
  console.log('Connected!');
  socket.emit('join_room', 'test-room');
  setTimeout(() => {
    console.log('Emitting open_chest');
    socket.emit('open_chest', { tx: 10, ty: 10 });
  }, 1000);
});
socket.on('chest_data', (data) => {
  console.log('Received chest data!', data);
  process.exit(0);
});
socket.on('connect_error', (err) => {
  console.log('Connect error:', err);
});
