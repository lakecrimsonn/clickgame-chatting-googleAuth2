//not good idea open websocket as soon as website is showed
//websocket has been opend in port 9090
var divElement = document.getElementById("ptag");
var value = divElement.getAttribute("value");
let ws = new WebSocket(value);

const btnCreate = document.getElementById("btnCreate");
const btnJoin = document.getElementById("btnJoin");
const txtGameId = document.getElementById("txtGameId");
const divPlayers = document.getElementById("divPlayers");
const divBoard = document.getElementById("divBoard");
const userId = document.getElementById("userId");
const btnReady = document.getElementById("btnReady");
const divGameBang = document.getElementById("divGameBang");
const gameStartDiv = document.getElementById("gameStartDiv");
const gameText = document.getElementById("gameText");
const btnExit = document.getElementById("btnExit");
const rankList = document.getElementById("rankList");

let playerColor = null;
let gameId = null;
let ready = false;

//very first connection
ws.onopen = function () {
  const clientId = userId.value;
  const payLoad = {
    method: "connect",
    clientId: clientId,
  };
  console.log("onopen : " + clientId + " 유저가 접속하였습니다.");
  ws.send(JSON.stringify(payLoad));
};

//create game
btnCreate.addEventListener("click", (e) => {
  console.log(userId.value + " 유저가 새로운 게임방을 만듭니다.");
  const payLoad = {
    method: "create",
    clientId: userId.value,
  };
  ws.send(JSON.stringify(payLoad));
});

//join
btnJoin.addEventListener("click", (e) => {
  //if (gameId === null) gameId = txtGameId.value;
  //  console.log("join game : " + gameId + " client id " + clientId);
  //
  // const payLoad = {
  //  method: "join",
  //  clientId: clientId,
  //   gameId: gameId,
  //};
  //btnReady.removeAttribute("disabled");
  //ws.send(JSON.stringify(payLoad));
});

//start
btnReady.addEventListener("click", (e) => {
  if (gameId === null) gameId = txtGameId.value;
  const payLoad = {
    method: "start",
    clientId: userId.value,
    gameId: gameId,
    ready: true,
  };
  btnReady.disabled = true;
  ws.send(JSON.stringify(payLoad));
});

//exit
btnExit.addEventListener("click", (e) => {
  const gameId = btnExit.id;

  if (gameId === null) {
    alert("게임 참여하지 않음");
    return;
  }

  const payLoad = {
    method: "exit",
    gameId: gameId,
    clientId: userId.value,
  };

  console.log("exit 버튼 리스너에서 gameId : " + gameId);

  ws.send(JSON.stringify(payLoad));
});

//receive a message from server
ws.onmessage = (message) => {
  //message.data, the data sever has been sent
  const response = JSON.parse(message.data);

  //create
  if (response.method === "create") {
    const game = response.game;
    console.log(game);
    const bangJang = response.clientId;
    const gameId = game.id;

    console.log("크리에이트에서 : " + bangJang + " " + gameId);

    const btn = document.createElement("button");
    btn.textContent = bangJang + "가 만든 게임, Game ID : " + gameId;
    btn.className = "btn btn-danger mt-1 mr-1";
    btn.type = "button";
    btn.id = gameId;
    btn.name = bangJang;
    btn.addEventListener("click", (e) => {
      const payLoad = {
        method: "join",
        clientId: userId.value,
        gameId: gameId,
      };
      txtGameId.value = btn.id;
      //btnReady.disabled = false;
      if (btn.name === userId.value) {
        btnReady.disabled = false;
      }
      ws.send(JSON.stringify(payLoad));
    });
    divGameBang.appendChild(btn);
    btn.click();
  }

  //update
  if (response.method === "update") {
    var game = response.game;
    checkUpdate(game);
  }

  //Broadcast Bang
  if (response.method === "makeBang") {
    var bangArray = response.bangArray;
    if (!Array.isArray(bangArray)) {
      return;
    }

    bangArray.forEach((e) => {
      if (!e) {
        return;
      }

      var gameId = e.gameid;
      var bangJang = e.clientid;
      var btn = document.createElement("button");
      btn.textContent = bangJang + "가 만든 게임, Game ID : " + gameId;
      btn.className = "btn btn-danger mt-1 mr-1";
      btn.type = "button";
      btn.id = gameId;
      btn.name = bangJang;
      btn.addEventListener("click", (c) => {
        const payLoad = {
          method: "join",
          clientId: userId.value,
          gameId: gameId,
        };
        txtGameId.value = btn.id;
        //btnReady.disabled = false;
        if (btn.name === userId.value) {
          btnReady.disabled = false;
        }
        ws.send(JSON.stringify(payLoad));
      });

      divGameBang.appendChild(btn);
    });
  }

  //join
  if (response.method === "join") {
    const game = response.game;
    const clientId = response.clientId;
    console.log("joined game id : " + game.id);

    //while (divPlayers.firstChild)
    //    divPlayers.removeChild(divPlayers.firstChild);

    const chkPlayers = divPlayers.querySelectorAll("span");
    chkPlayers.forEach((c) => {
      divPlayers.removeChild(c);
    });

    game.clients.forEach((c) => {
      const d = document.createElement("span");
      d.style.background = c.color;
      d.className = "btn btn-danger mt-1 mr-1";
      d.textContent = c.clientId;
      d.id = game.id;
      divPlayers.appendChild(d);
      if (clientId === userId.value) {
        playerColor = c.color;
      }

      console.log(c.clientId + " " + playerColor);
    });

    //while (divBoard.firstChild) divBoard.removeChild(divBoard.firstChild);

    for (let i = 0; i < game.balls; i++) {
      const b = document.createElement("button");
      b.id = "ball" + (i + 1);
      b.tag = i + 1;
      b.className = "btn btn-outline-secondary mx-1 my-1";
      b.textContent = i + 1;
      b.style.width = "55px";
      b.style.height = "55px";
      b.style.backgroundColor = "#ffffff";
      b.addEventListener("click", (e) => {
        console.log(playerColor);
        b.style.background = playerColor;
        const payLoad = {
          method: "play",
          clientId: userId.value,
          gameId: game.id,
          ballId: b.tag,
          color: playerColor,
        };
        ws.send(JSON.stringify(payLoad));
      });
      divBoard.appendChild(b);
      divBoard.style = "pointer-events: none";
    }

    btnCreate.disabled = true;
    btnJoin.disabled = true;
    const btnBang = divGameBang.querySelectorAll("button");
    btnBang.forEach((btn) => {
      btn.disabled = true;
    });
  }

  //ready2
  if (response.method === "start2") {
    divBoard.style = "pointer-events: auto";
    gameText.style.visibility = "visible";

    const payLoad = {};
    ws.send;
  }

  //win
  if (response.method === "win") {
    var winner = response.winner;
    console.log("winner : " + winner);
    gameText.textContent = winner + " is winner";
    divBoard.style = "pointer-events: none";

    const payLoad = {
      method: "restart",
    };

    ws.send(JSON.stringify(payLoad));
  }

  //join 할 때 exit에 게임아이디 할당
  if (response.method === "exit") {
    const game = response.game;

    btnExit.id = game.id;
    console.log("exit버튼에 게임아이디 할당 : " + btnExit.id);
  }

  //exit 버튼을 누른 후 서버 리스폰을 받아옴
  if (response.method === "exit2") {
    //divBoard.style = "pointer-events: none";
    const noOne = response.noOne;
    const gameId = response.gameId;

    console.log("exit2에서 " + gameId);
    const buttons = [...divGameBang.querySelectorAll("button")];
    if (noOne === true) {
      buttons.forEach((c) => {
        console.log(c.id);
        if (c.id === gameId) {
          console.log("일치");
          const payLoad = {
            method: "removeBang",
            gameId: gameId,
          };
          ws.send(JSON.stringify(payLoad));
        }
      });
    }
    location.reload();
  }

  //업데이트
  if (response.method === "updateRank") {
    var rank = response.rank;
    var rankNum = 0;
    console.log(rank);
    rank.forEach((e) => {
      rankNum += 1;
      var tr = document.createElement("tr");
      var th = document.createElement("th");
      th.scope = "row";
      th.textContent = rankNum;
      tr.appendChild(th);
      var td = document.createElement("td");
      td.textContent = e.clientid;
      tr.appendChild(td);
      var td2 = document.createElement("td");
      td2.textContent = e.win;
      tr.appendChild(td2);
      var td3 = document.createElement("td");
      console.log(e.date);
      td3.textContent = getDate(e.date);
      tr.appendChild(td3);

      rankList.appendChild(tr);
    });
  }

  function checkUpdate(game) {
    if (!game.state) return;

    const buttons = [...divBoard.querySelectorAll("button")];

    if (buttons === null) {
      return;
    }

    for (const b of Object.keys(game.state)) {
      var color = game.state[b];
      var ballObject = document.getElementById("ball" + b);
      ballObject.style.backgroundColor = color;
      var indexToRemove = buttons.indexOf(ballObject);
      buttons.splice(indexToRemove, 1);
    }

    buttons.forEach((c) => {
      c.style.backgroundColor = "#ffffff";
    });
  }

  function getDate(data) {
    const now = new Date(data);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    return formattedDate;
  }
};
