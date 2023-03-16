$(function () {
  "use strict";

  var content = $("#content");
  var input = $("#input");
  var status = $("#status");
  var myColor = false;
  var myName = $("#status").text();

  window.WebSocket = window.WebSocket || window.MozWebSocket;

  if (!window.WebSocket) {
    content.html(
      $("<p>", {
        text: "브라우저가 웹소켓을 지원하지 않습니다.",
      })
    );
    input.hide();
    $("span").hide();
    return;
  }

  var divElement = document.getElementById("ptag2");
  var value = divElement.getAttribute("value");
  var connection = new WebSocket(value);

  connection.onopen = function () {
    input.removeAttr("disabled");
    content.html(
      $("<p>", {
        text:
          "admin : 1. 방장이 create game을 눌러서 게임방을 만든다." +
          " 2. 방장이름의 버튼을 눌러 게임을 참여한다." +
          "3. 방장이 게임을 시작한다." +
          "4. 버튼 10개을 먼저 누른 사람이 승리" +
          "5. 게임 끝나고 방 나갈때 exit 꼭 눌러주기",
      })
    );
  };

  connection.onerror = function (error) {
    content.html(
      $("<p>", {
        text: "에러가 생겼습니다.",
      })
    );
  };

  connection.onmessage = function (message) {
    try {
      var json = JSON.parse(message.data);
      console.log(json);
    } catch (e) {
      console.log("Invalid JSON: ", message.data);
      return;
    }

    if (json.type === "history") {
      status.text(myName).css("color", myColor);
      input.removeAttr("disabled").focus();
      for (var i = 0; i < json.data.length; i++) {
        addMessage(
          json.data[i].author,
          json.data[i].text,
          json.data[i].color,
          new Date(json.data[i].time)
        );
      }
    } else if (json.type === "message") {
      status.text(myName).css("color", myColor);
      input.removeAttr("disabled").focus();
      addMessage(
        json.data.author,
        json.data.text,
        json.data.color,
        new Date(json.data.time)
      );
    }
  };

  input.keydown(function (e) {
    if (e.keyCode === 13) {
      var msg = $(this).val();

      if (!msg) {
        return;
      }

      connection.send(msg);

      $(this).val("");

      input.attr("disabled", "disabled");
    }
  });

  setInterval(function () {
    if (connection.readyState !== 1) {
      status.text("Error");
      input.attr("disabled", "disabled").val("웹소켓과 연결이 안됩니다.");
    }
  }, 3000);

  function addMessage(author, message, color, dt) {
    content.prepend(
      '<p><span style="color:' +
        color +
        '">' +
        author +
        " : " +
        "</span> " +
        message +
        "</p>"
    );
  }
});
