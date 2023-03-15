$(function () {
  "use strict";

  var content = $("#content");
  var input = $("#input");
  var status = $("#status");
  var myColor = false;
  var myName = $("#status").text();
  //var myName = $("#status").attr("placeholder"); // Get the value of the "value" attribute

  window.WebSocket = window.WebSocket || window.MozWebSocket;

  if (!window.WebSocket) {
    content.html(
      $("<p>", {
        text: "Sorry, but your browser doesn't support WebSocket.",
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
  };

  connection.onerror = function (error) {
    content.html(
      $("<p>", {
        text:
          "Sorry, but there's some problem with your " +
          "connection or the server is down.",
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
      input
        .attr("disabled", "disabled")
        .val("Unable to communicate with the WebSocket server.");
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
