const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect("mongodb://localhost:27017/screenapp");

const User = mongoose.model("User", {
  username: String,
  password: String
});

app.post("/register", async (req, res) => {
  const hash = await bcrypt.hash(req.body.password, 10);
  await User.create({ username: req.body.username, password: hash });
  res.send("Registered");
});

app.post("/login", async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (!user) return res.status(400).send("User not found");

  const ok = await bcrypt.compare(req.body.password, user.password);
  if (!ok) return res.status(400).send("Invalid password");

  const token = jwt.sign({ id: user._id }, "SECRET_KEY");
  res.send({ token });
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", socket => {
  socket.on("join", room => socket.join(room));
  socket.on("signal", data => {
    socket.to(data.room).emit("signal", data.message);
  });
});

server.listen(4000, () => console.log("Server running on 4000"));
