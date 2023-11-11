const express = require('express');
const app = express();
const http = require('http');

const server = http.createServer(app);
const socketIo = require('socket.io');

const io = socketIo(server, {cors: {origin: "*"} });

const ngrok = require('ngrok');


const cors = require('cors');

app.use(cors());
const connectedClients = new Map();



io.on("connection", (socket) => {
  // Check if the client's UID is already connected
  //const clientUID = socket.handshake.query.uid;
  //if (connectedClients.has(clientUID)) {
  //  // If the UID is already connected, disconnect the new connection
  //  socket.disconnect(true);
  //  return;
  //}


  console.log('Client connected: ', io.engine.clientsCount);

  // Send the number of connected clients to the client
  socket.emit('message', io.engine.clientsCount);
  socket.on('message', (message) => {
    // Handle WebSocket messages (e.g., forward to other clients)
    io.emit('message', message); // Broadcast the message to all connected clients
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});


const port = 3001;

server.listen(port, async () => {
  console.log(`Server is running on port ${port}`);

});
