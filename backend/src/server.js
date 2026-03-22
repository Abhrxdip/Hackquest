const dotenv = require("dotenv");
dotenv.config();

const app = require("./app");
const connectDB = require("./config/db");
const initSocket = require("./sockets/socket");

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();

  const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  const io = initSocket(server);

  app.set("io", io);

  app.use((req, _res, next) => {
    req.io = io;
    next();
  });
}

startServer();
