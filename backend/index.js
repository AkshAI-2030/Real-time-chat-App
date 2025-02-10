const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");
const { Server } = require("socket.io");
const http = require("http");
const Messages = require("./models/Messages");
const User = require("./models/User");

dotenv.config();
const app = express();

const corsOptions = {
  origin: "https://real-time-chat-app-frontend-ashen.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://real-time-chat-app-frontend-ashen.vercel.app",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
  transports: ["websocket", "polling"], // Ensure both transports are allowed
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Mongodb connected"))
  .catch((error) => console.error(error));

app.use("/auth", authRoutes);
//socket io logic
io.on("connection", (socket) => {
  console.log("User connected", socket.id);

  socket.on("send_message", async (data) => {
    const { sender, receiver, message } = data;
    const newMessage = new Messages({ sender, receiver, message });
    await newMessage.save();
    socket.broadcast.emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
  });
});

app.get("/messages", async (req, res) => {
  const { sender, receiver } = req.query;
  try {
    const messages = await Messages.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
    }).sort({ createdAt: 1 });
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages." });
  }
});

app.get("/users", async (req, res) => {
  const { currentUser } = req.query;

  try {
    const users = await User.find({ username: { $ne: currentUser } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
});
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`server running on port: ${PORT}`);
});
