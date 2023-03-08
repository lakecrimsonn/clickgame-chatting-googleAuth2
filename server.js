const express = require("express");
const app = express();

const WebSocketServer = require("websocket").server;
const http = require("http");
const port = 8080;

app.use(express.urlencoded({ extended: true }));
app.use("/", require("./routes/member.js"));
app.use("/", require("./routes/controller.js"));
app.use(express.static("public"));

var conn = require("./lib/db")();
/**
 * 전역 변수
 */
const colors = ["red", "green", "blue", "magenta", "purple", "plum", "orange"];
const clients1 = [];
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

app.get("/balls", (req, res, next) => {
  res.render("balls.ejs", {});
});

const wsServer = new WebSocketServer({
  httpServer: server,
});

wsServer.on("request", (request) => {
  const connection = request.accept();
  const index = clients1.push(connection) - 1;
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
      time: new Date(),
      text: htmlEntities(message.utf8Data),
      author: userName,
      color: userColor,
    };

    history.push(obj);
    history = history.slice(-100);
    sendToDB(Object.values(obj));

    clients1.forEach((client) => client.sendUTF(makeResponse("message", obj)));
  });

  connection.on("close", (connection) => {
    if (userName !== false && userColor !== false) {
      console.log(`Peer ${connection.remoteAddress} disconnected`);

      clients1.splice(index, 1);
      colors.push(userColor);
    }
  });
});

function sendToDB(objDB) {
  console.log(objDB);
  conn.query(
    "insert into project1.chatlog values(?,?,?,?);",
    objDB,
    function (err, rows) {
      if (err) throw err;
      if (rows[0]) console.log(rows[0]);
    }
  );
}

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

/**
 * balls
 */

const httpServer = http.createServer();
const websocketServer = require("websocket").server;

//tcp connection
httpServer.listen(9090, () => console.log("listening on ws port 9090"));

//hashmap
const clients = {};
const games = {};

//websocket connection and send http server as JSON
const wsServer2 = new websocketServer({
  httpServer: httpServer,
});

//capture client's connection
wsServer2.on("request", (request) => {
  //null = accept any kind of websocket protocol
  //null could be my own protocol
  const connection = request.accept(null, request.origin);

  //listen open and close event
  connection.on("open", () => console.log("opened"));
  connection.on("close", () => console.log("closed"));

  //space for all the message from the client
  connection.on("message", (message) => {
    //the data that a sever received from client
    //make string data to JSON
    const result = JSON.parse(message.utf8Data);

    //verify what message client sent
    if (result.method === "create") {
      //who is a client?
      const clientId = result.clientId;

      //a game client want to do
      const gameId = guid();
      games[gameId] = {
        id: gameId,
        balls: 20,
        clients: [],
      };

      const payLoad = {
        method: "create",
        game: games[gameId],
      };

      //send response to a client
      const con = clients[clientId].connection;
      con.send(JSON.stringify(payLoad));
    }

    if (result.method === "join") {
      const clientId = result.clientId;
      const gameId = result.gameId;
      const game = games[gameId];

      if (game.clients.length >= 4) {
        //sorry max player reached
        console.log("sorry max player reached");
        return;
      }
      //stores value that matches with [game.clients.length]
      const color = { 0: "Red", 1: "Green", 2: "Blue", 3: "Yellow" }[
        game.clients.length
      ];

      //all of the clients share same game id
      game.clients.push({
        clientId: clientId,
        color: color,
      });

      //start the game
      if (game.clients.length === 2) updateGameState();

      const payLoad = {
        method: "join",
        game: game,
      };

      //loop through all clients and tell them that people has joined
      game.clients.forEach((c) => {
        clients[c.clientId].connection.send(JSON.stringify(payLoad));
      });
    }

    if (result.method === "play") {
      const gameId = result.gameId;
      const ballId = result.ballId;
      const color = result.color;
      let state = games[gameId].state;
      if (!state) state = {};
      state[ballId] = color;
      games[gameId].state = state;
    }
  });

  //very first connection
  //generate a new clientId from guid()
  const clientId = guid();

  //can find specific client's connection
  clients[clientId] = {
    connection: connection,
  };

  //the message to send called method:'connect'
  const payLoad = {
    method: "connect",
    clientId: clientId,
  };

  //respond to client with JSON changed to string
  connection.send(JSON.stringify(payLoad));
});
function updateGameState() {
  //{"gameid", asfsaf}
  for (const g of Object.keys(games)) {
    const game = games[g];
    const payLoad = {
      method: "update",
      game: game,
    };
    game.clients.forEach((c) => {
      clients[c.clientId].connection.send(JSON.stringify(payLoad));
    });
  }
  setTimeout(updateGameState, 500);
}
//guid generator
const guid = () => {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
};
