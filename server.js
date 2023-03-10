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
  deleteSessions();
});

//서버 재시작시 세션 없애기
const deleteSessions = () => {
  conn.query("truncate project1.sessions", (err, result) => {
    if (err) {
      console.error(err);
    }
  });
};
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
  // if (!req.user) {
  //   console.log("로그인 하고 오렴");
  //   return res.send(
  //     "<script>alert('로그인 하고 오렴');location.href='/';</script>"
  //   );
  // }
  if (req.user) {
    userInfo = req.user.name;
  }
  res.render("balls.ejs", {
    user: userInfo,
  });
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
httpServer.listen(9090, () => console.log("ws port listen : 9090"));

//hashmap
const clients = {};
const games = {};
const bangHistory = {};
var cnt = 0;
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

  //space for all the message from the client
  connection.on("message", (message) => {
    //the data that a sever received from client
    //make string data to JSON
    const result = JSON.parse(message.utf8Data);

    //set client ID
    if (result.method === "connect") {
      const clientId = result.clientId;
      console.log("client id : " + clientId);
      clients[clientId] = {
        connection: connection,
      };

      conn.query("select * from project1.banghistory", (err, rows) => {
        console.log("DB connect : " + JSON.stringify(rows));
        if (rows) {
          rows.forEach((e) => {
            console.log("forEach : " + JSON.stringify(e));
            const payLoad = {
              method: "makeBang",
              clientId: e.clientid,
              gameId: e.gameid,
            };
            clients[clientId].connection.send(JSON.stringify(payLoad));
          });
        }
      });
    }

    //verify what message client sent
    if (result.method === "create") {
      //who is a client?
      const clientId = result.clientId;
      console.log("create user id : " + clientId);
      //a game client want to do
      const gameId = guid();
      games[gameId] = {
        id: gameId,
        balls: 20,
        clients: [],
      };

      console.log("sadlmf;lasmd : " + JSON.stringify(games[gameId]));
      console.log("sadlmf;lasmd : " + JSON.stringify(games));

      const payLoad = {
        method: "create",
        game: games[gameId],
        clientId: clientId,
      };

      //send response to a client
      const con = clients[clientId].connection;
      con.send(JSON.stringify(payLoad));
      sendBangQuery(clientId, gameId);
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

      console.log("color : " + color);
      //all of the clients share same game id
      game.clients.push({
        clientId: clientId,
        color: color,
        ready: false,
      });

      console.log("game.clients from join func : " + JSON.stringify(game));

      const payLoad = {
        method: "join",
        game: game,
      };

      //loop through all clients and tell them that people has joined
      game.clients.forEach((c) => {
        clients[c.clientId].connection.send(JSON.stringify(payLoad));
      });

      //start the game
      if (game.clients.length >= 1) {
        updateGameState();
      }
    }

    if (result.method === "play") {
      const gameId = result.gameId;
      const ballId = result.ballId;
      const color = result.color;
      let state = games[gameId].state;
      if (!state) state = {};
      state[ballId] = color;
      games[gameId].state = state;

      console.log(games[gameId]);

      var pColor = Object.values(games[gameId].state);
      var wBallsNum = parseInt(games[gameId].balls * 0.5);
      var pCnt = {
        rCnt: 0,
        gCnt: 0,
        bCnt: 0,
        yCnt: 0,
      };

      pColor.forEach((c) => {
        if (c === "Red") {
          pCnt.rCnt += 1;
        } else if (c === "Green") {
          pCnt.gCnt += 1;
        } else if (c === "Blue") {
          pCnt.bCnt += 1;
        } else if (c === "Yellow") {
          pCnt.yCnt += 1;
        }
      });

      let winner = null;

      if (wBallsNum === pCnt.rCnt) {
        console.log("Red win");
        winner = "Red";
        SendWinner(winner, gameId);
      } else if (wBallsNum === pCnt.gCnt) {
        console.log("Green win");
        winner = "Green";
        SendWinner(winner);
      } else if (wBallsNum === pCnt.bCnt) {
        console.log("Blue win");
        winner = "Blue";
        SendWinner(winner);
      } else if (wBallsNum === pCnt.gCnt) {
        console.log("Yellow win");
        winner = "Yellow";
        SendWinner(winner);
      }
    }

    //ready
    if (result.method === "ready") {
      const clientId = result.clientId; //a
      const gameId = result.gameId;
      const game = games[gameId]; //object

      for (var i = 0; i < game.clients.length; i++) {
        if (game.clients[i].clientId === clientId) {
          game.clients[i].ready = true;
          console.log("game.clients[" + i + "] : " + game.clients[i].ready);
          cnt += 1;
        }
      }

      console.log("cnt : " + cnt + ", length : " + game.clients.length);

      if (game.clients.length >= 1 && cnt === game.clients.length) {
        const payLoad = {
          method: "start",
        };

        game.clients.forEach((c) => {
          clients[c.clientId].connection.send(JSON.stringify(payLoad));
        });
      }
    }

    if (result.method === "restart") {
      cnt = 0;
      console.log("cnt : " + cnt);
    }
  });

  //the message to send called method:'connect'
  const payLoad = {
    method: "connect",
    //clientId: clientId,
  };

  //respond to client with JSON changed to string
  connection.send(JSON.stringify(payLoad));
});

//winner Send
function SendWinner(winner, gameId) {
  var gameId = gameId;
  var payLoad = {
    method: "win",
    winner: winner,
  };
  games[gameId].clients.forEach((c) => {
    clients[c.clientId].connection.send(JSON.stringify(payLoad));
  });
}

//ball change
function updateGameState() {
  for (const g of Object.keys(games)) {
    //g = game id
    const game = games[g];
    //console.log(game);
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

function sendBangQuery(clientId, gameId) {
  if (!clientId || !gameId) {
    return;
  }
  // const payLoad = {
  //   method: "makeBang",
  //   gameId: gameId,
  //   clientId: clientId,
  // };
  // clients[clientId].connection.send(JSON.stringify(payLoad));

  var gameInfo = [clientId, gameId];
  conn.query(
    "insert into project1.banghistory values (?,?)",
    gameInfo,
    (err, result) => {
      if (err) {
        console.error(err);
      }
    }
  );
  conn.query("select * from project1.banghistory", (err, rows) => {
    console.log("db에서 온 데이터 : " + JSON.stringify(rows));
  });

  bangHistory[clientId] = {
    clientId: clientId,
    gameId: gameId,
  };
  console.log("makeBang : " + JSON.stringify(bangHistory[clientId]));
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
