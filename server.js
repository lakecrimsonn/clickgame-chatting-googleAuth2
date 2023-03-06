const express = require("express");
const app = express();

const WebSocketServer = require("websocket").server;
const http = require("http");
const port = 8080;

app.use(express.urlencoded({ extended: true }));
app.use("/", require("./routes/db.js"));
app.use("/", require("./routes/controller.js"));
app.use(express.static("public"));
/**
 * 전역 변수
 */
const colors = ["red", "green", "blue", "magenta", "purple", "plum", "orange"];
const clients = [];
let history = [];
var userInfo;
/**
 * HTTP 서버
 */
const server = http.createServer(app);

server.listen(port, () => {
  console.log("server listen:", port);
});

/**
 * WebSocket 서버
 */

app.get("/chat", (req, res, next) => {
  if (!req.user) {
    console.log("로그인 하고 오렴");
    return res.send(
      "<script>alert('로그인 하고 오렴');location.href='/';</script>"
    );
  }
  if (req.user) {
    userInfo = req.user.name;
  }
  res.render("chatting.ejs", {
    user: userInfo,
  });
});

const wsServer = new WebSocketServer({
  httpServer: server,
});

wsServer.on("request", (request) => {
  const connection = request.accept();
  const index = clients.push(connection) - 1;
  let userName = false;
  let userColor = false;

  console.log("connection accepted:");

  if (history.length > 0) {
    connection.sendUTF(makeResponse("history", history));
  }

  connection.on("message", (message) => {
    if (userName === false) {
      userName = userInfo;
      userColor = colors.shift();
    }

    connection.sendUTF(makeResponse("color", userColor));
    console.log(`User is known as: ${userName} with ${userColor} color`);

    console.log(`Received Message from ${userName}: ${message.utf8Data}`);

    const obj = {
      time: new Date().getTime(),
      text: htmlEntities(message.utf8Data),
      author: userName,
      color: userColor,
    };

    history.push(obj);
    history = history.slice(-100);

    clients.forEach((client) => client.sendUTF(makeResponse("message", obj)));
  });

  connection.on("close", (connection) => {
    if (userName !== false && userColor !== false) {
      console.log(`Peer ${connection.remoteAddress} disconnected`);

      clients.splice(index, 1);
      colors.push(userColor);
    }
  });
});

/**
 * 유틸
 */
const htmlEntities = (str) =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const makeResponse = (type, data) => JSON.stringify({ type, data });
