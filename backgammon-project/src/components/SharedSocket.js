import io from 'socket.io-client';

const socket = io('localhost:3001', { reconnection: false });

export default socket;