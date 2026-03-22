const socketIo = require("socket.io");

function initSocket(server) {
  const io = socketIo(server, {
    cors: { origin: "*" }
  });

  return io;
}

module.exports = initSocket;
