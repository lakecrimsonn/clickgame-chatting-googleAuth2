const { response } = require("express");
const express = require("express");
const app = express();
const WebSocketServer = require("websocket").server;
const http = require("http");
const { use } = require("passport");
const port = 8080;

app.use(express.urlencoded({ extended: true }));
app.use("/", require("./routes/auth.js"));
app.use("/", require("./routes/member.js"));
app.use("/", require("./routes/controller.js"));
app.use(express.static("public"));

const conn = require("./lib/db")();

const colors = ["red", "green", "blue", "magenta", "purple", "plum", "orange"];
const clients1 = [];
let history = [];
let userInfo;

const wsUrl = process.env.WS_URL;
const wsUrl2 = process.env.WS_URL2;
const srUrl = process.env.SERVER_URL;

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

app.get("/chat", (req, res, next) => {
  if (!req.user) {
    console.log("로그인 하고 오렴");
    return res.send(
      "<script>alert('로그인 하고 오렴');location.href='/';</script>"
    );
  } else {
    userInfo = req.user;
  }

  res.render("chatting.ejs", {
    user: userInfo,
    wsUrl: wsUrl,
    srUrl: srUrl,
  });
});

app.get("/clicking", (req, res, next) => {
  if (!req.user) {
    console.log("로그인 하고 오렴");
    return res.send(
      "<script>alert('로그인 하고 오렴');location.href='/';</script>"
    );
  } else {
    userInfo = req.user;
  }

  res.render("clicking.ejs", {
    user: userInfo,
    wsUrl: wsUrl,
    wsUrl2: wsUrl2,
    srUrl: srUrl,
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

const htmlEntities = (str) =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const makeResponse = (type, data) => JSON.stringify({ type, data });

//click game
const httpServer = http.createServer();
const websocketServer = require("websocket").server;

//tcp connection
httpServer.listen(9090, () => console.log("ws port listen : 9090"));

//hashmap
const clients = {};
const games = {};
const bangHistory = {};

//var cnt = 0;
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

    //첫연결
    if (result.method === "connect") {
      const clientId = result.clientId;
      console.log("client id : " + clientId);
      clients[clientId] = {
        connection: connection,
      };

      queryDB(clientId);
      rankUpdate(clientId);
    }

    //방개설
    if (result.method === "create") {
      const bangJang = result.clientId;
      console.log(bangJang + " 방장이 새로운 게임방을 서버에 신청합니다.");

      const gameId = guid();
      games[gameId] = {
        id: gameId,
        balls: 20,
        clients: [],
      };

      var color = "white";

      games[gameId].clients.push({
        clientId: bangJang,
        color: color,
        ready: false,
      });

      sendBangQuery(bangJang, gameId);

      const payLoad = {
        method: "create",
        game: games[gameId],
        clientId: bangJang,
      };

      clients[bangJang].connection.send(JSON.stringify(payLoad));

      // const payLoad = {
      //   method: "create",
      //   game: games[gameId],
      //   clientId: clientId,
      // };

      // const payLoad = {
      //   method: "makeBang",
      //   bangArray: games[gameId],
      // };

      // const con = clients[clientId].connection;
    }

    if (result.method === "join") {
      const clientId = result.clientId;
      const gameId = result.gameId;
      const game = games[gameId];

      console.log(games[gameId]);
      console.log(clientId);
      //중복 접속 체크
      games[gameId].clients.forEach((c) => {
        console.log("중복에서 : " + JSON.stringify(c));
        if (c.clientId === clientId) {
          console.log(c.clientId + "는 이미 접속 중");
          games[gameId].clients = games[gameId].clients.filter(
            (c) => c.clientId !== clientId
          );
          return;
        }
      });

      //클라이언트 최대수 체크
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
        ready: false,
      });

      console.log("game.clients from join func : " + JSON.stringify(game));

      const payLoad = {
        method: "join",
        game: game,
        clientId: clientId,
      };

      //loop through all clients and tell them that people has joined
      game.clients.forEach((c) => {
        clients[c.clientId].connection.send(JSON.stringify(payLoad));
      });

      const payLoad2 = {
        method: "exit",
        game: game,
      };

      game.clients.forEach((c) => {
        clients[c.clientId].connection.send(JSON.stringify(payLoad2));
      });

      //start the game
      if (game.clients.length >= 2) {
        updateGameState();
      }
    }

    if (result.method === "play") {
      const gameId = result.gameId;
      const ballId = result.ballId;
      const color = result.color;
      const clientId = result.clientId;

      console.log(games[gameId]);
      games[gameId].clients.forEach((e) => {
        if (e === null) {
          console.log("클라이언트가 없음");
          return false;
        }
      });

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
        SendWinner(winner, clientId, gameId);
      } else if (wBallsNum === pCnt.gCnt) {
        console.log("Green win");
        winner = "Green";
        SendWinner(winner, clientId, gameId);
      } else if (wBallsNum === pCnt.bCnt) {
        console.log("Blue win");
        winner = "Blue";
        SendWinner(winner, clientId, gameId);
      } else if (wBallsNum === pCnt.gCnt) {
        console.log("Yellow win");
        winner = "Yellow";
        SendWinner(winner, clientId, gameId);
      }
    }

    //ready
    if (result.method === "start") {
      const clientId = result.clientId; //a
      const gameId = result.gameId;
      const game = games[gameId]; //object
      // var cnt = 0;

      // for (var i = 0; i < game.clients.length; i++) {
      //   if (game.clients[i].clientId === clientId) {
      //     game.clients[i].ready = true;
      //     console.log("game.clients[" + i + "] : " + game.clients[i].ready);
      //   }

      //   if (game.clients[i].ready === true) {
      //     cnt += 1;
      //   }
      // }

      //console.log("cnt : " + cnt + ", length : " + game.clients.length);

      if (game.clients.length >= 1) {
        const payLoad = {
          method: "start2",
        };

        game.clients.forEach((c) => {
          clients[c.clientId].connection.send(JSON.stringify(payLoad));
        });
      }
    }

    if (result.method === "restart") {
      //cnt = 0;
      //console.log("cnt : " + cnt);
    }

    if (result.method === "exit") {
      const gameId = result.gameId;
      const clientId = result.clientId;

      console.log("exit 버튼을 클릭한 클라이언트 : " + clientId);

      if (!games[gameId]) {
        return;
      }

      games[gameId].clients = games[gameId].clients.filter(
        (client) => client.clientId !== clientId
      );

      var noOne = false;

      if (games[gameId].clients.length === 0) {
        noOne = true;
      }

      const payLoad = {
        method: "exit2",
        noOne: noOne,
        gameId: gameId,
      };

      clients[clientId].connection.send(JSON.stringify(payLoad));

      console.log(games[gameId]);
    }

    if (result.method === "removeBang") {
      const gameId = result.gameId;
      console.log(gameId);
      conn.query(
        "delete from project1.banghistory where gameid = (?)",
        gameId,
        (err, result) => {
          if (err) {
            console.error(err);
          }
        }
      );
    }
  });
});

//winner Send
function SendWinner(winner, clientId, gameId) {
  var win = 0;
  var date = new Date();
  var gameInfo = [clientId, win, date];

  conn.query(
    "select win from project1.rank where clientid = (?)",
    clientId,
    (err, rows) => {
      if (err) {
        console.error(err);
      }

      if (rows.length === 0) {
        console.log("새로운 랭커 " + clientId + "를 추가합니다.");
        gameInfo[1] = 1;
        conn.query(
          "insert into project1.rank values (?,?,?)",
          gameInfo,
          (err, result) => {
            if (err) {
              console.error(err);
            }
          }
        );
      } else {
        var win = rows[0].win;
        win += 1;
        console.log(gameInfo + "의 랭크 데이터를 업그레이드합니다.");
        console.log(date);
        conn.query(
          "update project1.rank set win = (?), date = (?) where clientid = (?)",
          [win, date, clientId],
          (err, rows) => {
            if (err) {
              console.error(err);
            }
          }
        );
      }
    }
  );

  console.log("표기할 랭크 정보 : " + gameInfo);

  const payLoad = {
    method: "win",
    winner: winner,
  };

  games[gameId].clients.forEach((c) => {
    clients[c.clientId].connection.send(JSON.stringify(payLoad));
  });
}

//rank update
function rankUpdate(clientId) {
  conn.query("select * from project1.rank", (err, rows) => {
    if (err) {
      console.error(err);
    }

    rows.sort((a, b) => b.win - a.win);
    const payLoad = {
      method: "updateRank",
      rank: rows,
    };
    clients[clientId].connection.send(JSON.stringify(payLoad));
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

    //console.log(JSON.stringify(games));
  }
  setTimeout(updateGameState, 500);
}

function sendBangQuery(clientId, gameId) {
  if (!clientId || !gameId) {
    return;
  }

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
  console.log(
    "sendBangQuery에서 DB 데이터 : " + JSON.stringify(bangHistory[clientId])
  );
}

function queryDB(clientId) {
  conn.query("select * from project1.banghistory", (err, rows) => {
    console.log("방 히스토리 : " + JSON.stringify(rows));
    if (rows) {
      const payLoad = {
        method: "makeBang",
        bangArray: rows,
      };
      clients[clientId].connection.send(JSON.stringify(payLoad));
    }
  });
}

const guid = () => {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
};
