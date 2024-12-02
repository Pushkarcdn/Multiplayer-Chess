const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = socket(server);

const chess = new Chess();

let players = {};
let currentPlayer = "W";

const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; script-src 'self' https://cdn.socket.io https://cdnjs.cloudflare.com; style-src 'self' https://cdn.jsdelivr.net; img-src 'self';"
  );
  next();
});

app.get("/", (req, res) => {
  res.render("index");
});

io.on("connection", (uniquesocket) => {
  if (!players.white) {
    players.white = uniquesocket.id;
    uniquesocket.emit("playerRole", "w");
    console.log("White player connected");
  } else if (!players.black) {
    players.black = uniquesocket.id;
    uniquesocket.emit("playerRole", "b");
    console.log("Black player connected");
  } else {
    uniquesocket.emit("spectatorRole");
    uniquesocket.emit("boardState", chess.fen()); // Send current game state to the spectator
    console.log("Spectator connected");
  }

  if (players.white && players.black) {
    io.emit("connection", "Connected!");
  }

  uniquesocket.on("disconnect", () => {
    if (uniquesocket.id === players.white) {
      delete players.white;
      io.emit("connection", "White player disconnected.");
      chess.reset();
      io.emit("boardState", chess.fen());
    } else if (uniquesocket.id === players.black) {
      delete players.black;
      io.emit("connection", "Black player disconnected.");
      chess.reset();
      io.emit("boardState", chess.fen());
    }
  });

  uniquesocket.on("move", (move) => {
    if (!players.white || !players.black) return;

    try {
      if (chess.turn() === "w" && uniquesocket.id !== players.white) return;

      if (chess.turn() === "b" && uniquesocket.id !== players.black) return;

      const result = chess.move(move);

      if (result) {
        currentPlayer = chess.turn();
        io.emit("turn", currentPlayer);
        io.emit("move", move);
        io.emit("boardState", chess.fen());
      } else {
        console.log("Invalid move: ", move);
        uniquesocket.emit("invalidMove: ", move);
      }
    } catch (err) {
      console.log(err);
      uniquesocket.emit("invalidMove: ", move);
    }
  });
});

server.listen(port, () => {
  console.log("Server is running on port " + port);
});
