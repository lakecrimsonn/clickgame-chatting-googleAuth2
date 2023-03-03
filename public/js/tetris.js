/*
    방향별로 정의하기
          □□□□   :  "0:0", "1:0", "2:0", "3:0"        "0:0", "0:1", "0:2", "0:3"
    
          □        
          □□     :  "0:0", "1:0", "-1:0"          "0:1", "0:0", "1:0"          "0:0", "1:0", "1:1"          "0:1", "1:1", "1:0"
    
           □        "0:1", "1:1", "1:0"           "0:0", "0:1", "1:1"          "0:1", "0:0", "1:0"          "0:0", "1:0", "1:1"
          □□     :  
    
          □         
          □□□    :   "0:1", "1:1", "2:1", "0:0"            "0:2", "0:1", "0:0", "1:0"            "0:0", "1:0", "2:0", "2:1"            "0:2", "1:2", "1:1", "1:0"
    
            □        
          □□□    :   "0:1", "1:1", "2:1", "2:0"            "1:-1", "1:0", "1:1", "2:1"            "-1:1", "-1:0", "0:0", "1:0"            "0:-1", "1:-1", "1:0", "1:1"
    
          □□         
          □□     :   "0:1", "1:1", "0:0", "1:0"
    
    */
var ALL_BLOCK = new Array();
var BLOCK_POSITION_SHAPE = 0; //동일한 블록 내에서의 각도 형태
ALL_BLOCK[0] = [
  ["0:0", "1:0", "2:0", "3:0"],
  ["0:0", "0:1", "0:2", "0:3"],
];
ALL_BLOCK[1] = [
  ["0:0", "0:1", "1:1"],
  ["0:1", "0:0", "1:0"],
  ["0:0", "1:0", "1:1"],
  ["1:0", "0:1", "1:1"],
];
ALL_BLOCK[2] = [
  ["0:1", "1:1", "1:0"],
  ["0:-1", "0:0", "1:0"],
  ["0:1", "0:0", "1:0"],
  ["0:-1", "1:-1", "1:0"],
];
ALL_BLOCK[3] = [
  ["0:1", "1:1", "2:1", "0:0"],
  ["0:1", "0:0", "0:-1", "1:-1"],
  ["0:-2", "1:-2", "2:-2", "2:-1"],
  ["0:0", "0:1", "-1:2", "0:2"],
];
ALL_BLOCK[4] = [
  ["0:1", "1:1", "2:1", "2:0"],
  ["1:-1", "1:0", "1:1", "2:1"],
  ["-1:1", "-1:0", "0:0", "1:0"],
  ["0:-1", "1:-1", "1:0", "1:1"],
];
ALL_BLOCK[5] = [["1:1", "2:1", "1:0", "2:0"]];

var ALL_TD = [];
function makeBlock(col, row) {
  for (var i = 1; i <= row; i++) {
    //세로
    document.write("<tr>");
    var X_array = [];
    for (var j = 1; j <= col; j++) {
      //가로
      var block_html = `
                              <td class="space" id="${j}_${i}" x="${j}" y="${i}">
                              </td>
                          `;
      document.write(block_html);
      X_array.push(j + "_" + i);
    }
    document.write("</tr>");
    ALL_TD.push(X_array);
  }
}

function moveBlock(gubun) {
  if (NOW_BLOCK) {
    if (gubun == "UP") {
      //모양 변경 기능이죠
      if (ALL_BLOCK[NOW_BLOCK.shape].length == 1) {
        return false;
      }

      var is_stop = false;
      var new_current_blocks = [];
      BLOCK_POSITION_SHAPE++;
      if (!ALL_BLOCK[NOW_BLOCK.shape][BLOCK_POSITION_SHAPE]) {
        BLOCK_POSITION_SHAPE = 0;
      }
      for (
        var i = 0;
        i < ALL_BLOCK[NOW_BLOCK.shape][BLOCK_POSITION_SHAPE].length;
        i++
      ) {
        var current_standard_x = NOW_BLOCK.current_blocks[0].attr("x");
        var current_standard_y = NOW_BLOCK.current_blocks[0].attr("y");

        var block_xy =
          ALL_BLOCK[NOW_BLOCK.shape][BLOCK_POSITION_SHAPE][i].split(":");
        var new_x = Number(block_xy[0]) + Number(current_standard_x);
        var new_y = Number(block_xy[1]) + Number(current_standard_y);
        var new_id = new_x + "_" + new_y;

        if ($("#" + new_id).length == 0) {
          //막다른 길
          is_stop = true;
        } else {
          if (
            $("#" + new_id).attr("class") == "block" &&
            !isExistNowBlock(new_id)
          ) {
            is_stop = true;
          }
        }

        new_current_blocks.push($("#" + new_id));
      }

      if (is_stop == true) {
        return false;
      }

      NOW_BLOCK.current_blocks.forEach(function (item, index) {
        item.attr("class", "space");
      });

      new_current_blocks.forEach(function (item, index) {
        item.attr("class", "block");
      });

      NOW_BLOCK.current_blocks = new_current_blocks;
    } else if (gubun == "RIGHT") {
      var new_current_blocks = [];
      var is_stop = false;
      NOW_BLOCK.current_blocks.forEach(function (item, index) {
        var new_id = Number(item.attr("x")) + 1 + "_" + item.attr("y");
        if ($("#" + new_id).length == 0) {
          is_stop = true;
        } else {
          if (
            $("#" + new_id).attr("class") == "block" &&
            !isExistNowBlock(new_id)
          ) {
            is_stop = true;
          }
        }

        new_current_blocks.push($("#" + new_id));
      });

      if (is_stop == true) {
        //막힌 길이면 중단하기
        return false;
      }

      NOW_BLOCK.current_blocks.forEach(function (item, index) {
        item.attr("class", "space");
      });
      new_current_blocks.forEach(function (item, index) {
        item.attr("class", "block");
      });
      NOW_BLOCK.current_blocks = new_current_blocks;
    } else if (gubun == "LEFT") {
      var new_current_blocks = [];
      var is_stop = false;
      NOW_BLOCK.current_blocks.forEach(function (item, index) {
        var new_id = Number(item.attr("x")) - 1 + "_" + item.attr("y");
        if ($("#" + new_id).length == 0) {
          is_stop = true;
        } else {
          if (
            $("#" + new_id).attr("class") == "block" &&
            !isExistNowBlock(new_id)
          ) {
            is_stop = true;
          }
        }
        new_current_blocks.push($("#" + new_id));
      });

      if (is_stop == true) {
        //막힌 길이면 중단하기
        return false;
      }

      NOW_BLOCK.current_blocks.forEach(function (item, index) {
        item.attr("class", "space");
      });
      new_current_blocks.forEach(function (item, index) {
        item.attr("class", "block");
      });
      NOW_BLOCK.current_blocks = new_current_blocks;
    } else if (gubun == "DOWN") {
      moveDown();
    } else if (gubun == "SPACEBAR") {
      while (moveDown() == true) {}
    }
  }
}

function moveDown() {
  var new_current_blocks = [];
  var is_stop = false;
  NOW_BLOCK.current_blocks.forEach(function (item, index) {
    var new_id = item.attr("x") + "_" + (Number(item.attr("y")) + 1);
    if ($("#" + new_id).length == 0) {
      //막다른 길
      is_stop = true;
    } else {
      if (
        $("#" + new_id).attr("class") == "block" &&
        !isExistNowBlock(new_id)
      ) {
        is_stop = true;
      }
    }
    new_current_blocks.push($("#" + new_id));
  });

  var return_value = true;
  if (is_stop == true) {
    //막힌 길이면 중단하기
    return_value = false;

    //게임 END 상황인지 확인 -> 현재 블록 위치를 확인해서 그 중에 y값이 1이거나 그보다 더 작은 것이 있으면 종료 상황
    NOW_BLOCK.current_blocks.forEach(function (item, index) {
      var y = item.attr("y");
      if (y <= 1) {
        //게임종료 상황
        clearInterval(interval);
        alert("게임 종료!");
        return false;
      }
    });
  } else {
    NOW_BLOCK.current_blocks.forEach(function (item, index) {
      item.attr("class", "space");
    });
    new_current_blocks.forEach(function (item, index) {
      item.attr("class", "block");
    });
    NOW_BLOCK.current_blocks = new_current_blocks;
  }
  if (!return_value) {
    checkAllLine();
    newBlock();
  }
  return return_value;
}

function checkAllLine() {
  for (var row = ALL_TD.length - 1; row >= 0; row--) {
    var is_all_correct = true;
    for (var col = 0; col < ALL_TD[row].length; col++) {
      var this_id = ALL_TD[row][col];
      var this_obj = $("#" + this_id);
      if (this_obj.attr("class") == "space") {
        is_all_correct = false;
      }
    }

    if (is_all_correct) {
      //row
      for (var k = row; k > 0; k--) {
        for (var j = 0; j < ALL_TD[k].length; j++) {
          var this_id = ALL_TD[k][j];
          var this_obj = $("#" + this_id);

          var upon_id = ALL_TD[k - 1][j];
          var upon_obj = $("#" + upon_id);
          var upon_obj_class = upon_obj.attr("class");

          this_obj.attr("class", upon_obj_class);

          if (upon_obj.length > 0) {
            upon_obj.attr("class", "space");
          }
        }
      }
      //이곳까지 실행하면 현재 줄 전체를 위줄로 바꾸고... 위줄은 흰색으로 바꿈
      row++;

      for (var j = 0; j < ALL_TD[0].length; j++) {
        var this_id = ALL_TD[0][j];
        var this_obj = $("#" + this_id);
        this_obj.attr("class", "space");
      }

      //한줄내릴때마다 Score 1000추가
      var current_score = $("#score").html();
      current_score = Number(current_score) + 100;
      $("#score").html(current_score);

      if (current_score % 1000 == 0) {
        //레벨 올리기
        var current_level = $("#level").html();
        current_level = Number(current_level) + 1;
        $("#level").html(current_level);

        interval_miliseconds = interval_miliseconds - 200;
        clearInterval(interval);
        intervalDown();
      }
    }
  }
}

function isExistNowBlock(id) {
  var is_exist = false;
  NOW_BLOCK.current_blocks.forEach(function (item, index) {
    if (item.attr("id") == id) {
      is_exist = true;
    }
  });

  return is_exist;
}

var NOW_BLOCK = new Object();
NOW_BLOCK.shape = null; //현재 블록 형태
NOW_BLOCK.current_blocks = null; //현재 블록의 위치를 저장
$(document).ready(function () {
  //메모리 적재 시기에 작동
  newBlock();

  //1초에 한번씩 내리기
  intervalDown();

  $(document).keydown(function (e) {
    if (e.which == 38) {
      //위 방향의 키를 누름
      //                        alert("위")
      moveBlock("UP");
    } else if (e.which == 39) {
      //                        alert("오른쪽")
      moveBlock("RIGHT");
    } else if (e.which == 37) {
      //                        alert("왼쪽")
      moveBlock("LEFT");
    } else if (e.which == 40) {
      //                        alert("아래쪽")
      moveBlock("DOWN");
    } else if (e.which == 32) {
      //                        alert("스페이스바")
      moveBlock("SPACEBAR");
    }
  });
});

//랜덤 숫자 생성 함수
function rand(min, max) {
  //Math.random() : 0~1사이의 숫자를 랜덤하게 가지고 오는 자바스크립트 함수
  //Math.floor : 소수점 자리를 버려서 정수로 만듬
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var NEXT_BLOCK_SHAPE = null;
function newBlock() {
  //랜덤하게 가지고 올 것
  BLOCK_POSITION_SHAPE = 0;

  if (!NEXT_BLOCK_SHAPE) {
    NOW_BLOCK.shape = rand(0, ALL_BLOCK.length - 1);
    NEXT_BLOCK_SHAPE = rand(0, ALL_BLOCK.length - 1);
  } else {
    NOW_BLOCK.shape = NEXT_BLOCK_SHAPE;
    NEXT_BLOCK_SHAPE = rand(0, ALL_BLOCK.length - 1);
  }
  NOW_BLOCK.current_blocks = diplayBlock(NOW_BLOCK);

  showNextBlock();
}

function showNextBlock() {
  $("#divNextImg").html(
    `<img src="http://localhost:8080/images/${NEXT_BLOCK_SHAPE}.gif" style="width:100%; height:200px">`
  );
}

var interval = null;
var interval_miliseconds = 1000;
var minimal_miliseconds = 100;
function intervalDown() {
  if (interval_miliseconds < minimal_miliseconds) {
    interval_miliseconds = minimal_miliseconds;
  }

  interval = setInterval(() => {
    // 블록을 하나씩 내리는 것
    moveDown();
  }, interval_miliseconds);
}

var INIT_X_POSITION = 5; //초기 블록의 x위치값
var INIT_Y_POSITION = 1; //초기 블록의 y위치값
function diplayBlock(nowblock) {
  //원하는 블록(=nowblock)을 원하는 위치에 출력
  //ALL_BLOCK[nowblock.shape]
  var current_blocks = [];
  for (
    var i = 0;
    i < ALL_BLOCK[nowblock.shape][BLOCK_POSITION_SHAPE].length;
    i++
  ) {
    // ALL_BLOCK[nowblock.shape][0]  ->   "0:0"
    var block_xy =
      ALL_BLOCK[nowblock.shape][BLOCK_POSITION_SHAPE][i].split(":");
    var block_x = Number(block_xy[0]) + INIT_X_POSITION;
    var block_y = Number(block_xy[1]) + INIT_Y_POSITION;

    $("#" + block_x + "_" + block_y).attr("class", "block");
    current_blocks.push($("#" + block_x + "_" + block_y));
  }
  return current_blocks;
}
