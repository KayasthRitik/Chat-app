if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require("express");
const app = express();
const http = require("http");
const socketIo = require("socket.io");
const cookieParser = require("cookie-parser");
const path = require("path");
const { urlencoded } = require("body-parser");
const mongoose = require("mongoose");
const userModel = require("./models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;
const ejsMate = require("ejs-mate");
const { title } = require("process");
const { attachUser, isLoggedIn } = require("./middlewares/auth");


app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.json());
app.use(urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

const server = http.createServer(app);
const io = socketIo(server);
const uri = process.env.MONGO_URI;
async function startServer() {
  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected");

    server.listen(8080, () => {
      console.log("🌐 Server running on http://localhost:8080");
    });

  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
}



app.use(attachUser);

app.get("/", isLoggedIn, (req, res) => {
  res.render("index", { title: "Home" })
});


app.get("/signup", (req, res) => {
  res.render("signup", { title: "SignUp", error: null });
});

app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  //Validate unique user
  const existingUser = await userModel.findOne({ username });
  if (existingUser) {
    return res.render("signup", { title: "SignUp", error: "Username already taken. Please choose another." });
  }

  // Validate user input
  bcrypt.genSalt(10, function (err, salt) {
    bcrypt.hash(password, salt, async (err, hash) => {
      let createdUser = await userModel.create({
        username,
        password: hash,
        email
      });
      let token = jwt.sign({ username }, jwtSecret);
      res.cookie("token", token);
      res.redirect("/");
    });
  });

});

// Middleware to check authentication login

app.get("/login", (req, res) => {
  res.render("login", { title: "LogIn", error: null });
});

app.post("/login", async (req, res) => {

  const {username, password} = req.body;
  const user = await userModel.findOne({username});

  if(!user){
    return res.render("login", { title: "LogIn", error: "User not found" });
  }else{console.log("USER DETAIL:",user)};

  bcrypt.compare(req.body.password, user.password, function (err, result) {
    let token = jwt.sign({ username: user.username }, jwtSecret);
    res.cookie("token", token);
    if (result) res.redirect("/");
    else return res.render("login", { title: "LogIn", error: "Wrong password" });
  });
});

// logout route
app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});


io.on("connection", (socket) => {
  console.log("New user connected");

  const defaultRooms = ["General", "Tech", "Gaming", "Random"];
  socket.emit("roomList", defaultRooms);


  socket.on("joinRoom", ({ username, room }) => {
    socket.join(room);
    socket.username = username;
    socket.room = room;

    // Welcome message
    socket.emit("message", { user: "system", text: `Welcome ${username}!` });

    // Notify others
    socket.broadcast.to(room).emit("message", {
      user: "system",
      text: `${username} has joined the room.`,
    });
  });

  socket.on("chatMessage", (msg) => {
    io.to(socket.room).emit("message", {
      user: socket.username,
      text: msg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  });

  socket.on("disconnect", () => {
    if (socket.username && socket.room) {
      io.to(socket.room).emit("message", {
        user: "system",
        text: `${socket.username} has left the chat.`,
      });
    }
  });
});

startServer();
server.listen(8080, () => console.log("Server running on http://localhost:8080"));