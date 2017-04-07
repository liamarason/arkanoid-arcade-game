$(window).ready(function() {
  newLevel(level)
  window.requestAnimationFrame(draw)
})

var canvas = document.getElementById("game")
var ctx = canvas.getContext("2d")

var allowSpace = true
var leftPressed = false
var rightPressed = false
var spacePressed = false
var powerUpActive = false

var blocksDestroyed = 0
var paddleHitsSincePowerUp = 0
var level = 1
var lives = 3
var powerUpHitsMax = 4

var blocksToWin
var powerUpSpawn
var powerUpType

var ball = {
  x: canvas.width/2,
  y: canvas.height - 45,
  xVelocity: 0,
  yVelocity: 0,
  prevXVelocity: 3, // start at initial velocity
  prevYVelocity: -3,
  radius: 5
}

var paddle = {
  x: (canvas.width - 75)/2,
  y: canvas.height - 40,
  height: 10,
  width: 75,
  cornerRadius: 5
}

var blocks = []
var block = {
  rowSize: 0,
  colSize: 0,
  width: 75,
  height: 20,
  padding: 5,
  spacingTop: 30,
  spacingLeft: 30
}

var powerUp = {
  x: 0,
  y: 0,
  width: 12,
  velocity: 1.5,
  visible: false
}

$(window).keydown(function(e) {
  if (e.keyCode === 37) {
    leftPressed = true
  } else if (e.keyCode === 39){
    rightPressed = true
  }
});

$(window).keyup(function(e) {
  if (e.keyCode === 37) {
    leftPressed = false
  } else if (e.keyCode === 39){
    rightPressed = false
  }
});

$(window).keydown(function(e) {
  if (e.keyCode === 32 && allowSpace) {
    var a = Math.pow(ball.prevXVelocity, 2)
    var b = Math.pow(ball.prevYVelocity, 2)
    var totalSpeed = Math.sqrt(a + b)
    ball.xVelocity = totalSpeed*Math.cos(Math.PI/4)
    ball.yVelocity = -totalSpeed*Math.sin(Math.PI/4)
    spacePressed = true
    allowSpace = false
  }
});

function newLevel(levelValue) {
  $.getJSON("level_data.json", function(data) {
    var lvl
    if (levelValue === 1) {
      lvl = data.levelOne
    } else if (levelValue === 2) {
      lvl = data.levelTwo
    } else {
      lvl = data.levelThree
    }
    block.rowSize = lvl.rowCount
    block.colSize = lvl.colCount
    blocksToWin = lvl.totalCount
    hardPosition = lvl.hardPosition

    // random power-up spawn location and type for each level
    powerUpSpawn = Math.floor(Math.random() * (10 - 3)) + 3
    if (Math.round(Math.random())) {
      powerUpType = "width"
    } else {
      powerUpType = "noDeflect"
    }

    // create blocks
    for (i = 0; i < block.colSize; i ++) {
      blocks[i] = []
      for(j = 0; j < block.rowSize; j ++) {
        blocks[i][j] = {
          x: 0,
          y: 0,
          visible: true,
          state: "soft",
          hitsToBreak: 1
        }
        if ((j === 0 && hardPosition === "top") || (j === block.rowSize - 1 && hardPosition === "bottom")
        || ((i === j || i + j === block.rowSize - 1) && hardPosition === "diagonal")) {
          blocks[i][j].state = "hard"
          blocks[i][j].hitsToBreak = 3
        }
      }
    }
  })
}

function drawBall() {
  ctx.beginPath()
  var gradient = ctx.createRadialGradient(ball.x, ball.y, 1, ball.x, ball.y, ball.radius)
  if (powerUpActive && powerUpType === "noDeflect") {
    gradient.addColorStop(0, "red")
  } else {
    gradient.addColorStop(0, "white")
  }
  gradient.addColorStop(1, "RGB(148, 152, 161)")
  ctx.arc(ball.x, ball.y, ball.radius, 0, 2*Math.PI)
  ctx.fillStyle = gradient
  ctx.fill()
  if (powerUpActive && powerUpType === "noDeflect") {
    ctx.strokeStyle = "yellow"
    ctx.stroke()
  }
}

function drawPaddle() {
  roundRect(paddle.x, paddle.y, paddle.width, paddle.height, paddle.cornerRadius)
}

// draws a round rectangle
function roundRect(x, y, width, height, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.strokeStyle = "yellow"
  ctx.fillStyle = "grey"
  ctx.fill()
  ctx.stroke()
}

function drawblocks() {
  for (i = 0; i < block.colSize; i ++) {
    for (j = 0; j < block.rowSize; j ++) {
      if (blocks[i][j].visible) {
        var newX = i*(block.width + block.padding) + block.spacingLeft
        var newY = j*(block.height + block.padding) + block.spacingTop
        blocks[i][j].x = newX
        blocks[i][j].y = newY

        ctx.beginPath()
        ctx.rect(newX, newY, block.width, block.height)
        if (blocks[i][j].state === "hard") {
          ctx.fillStyle = "#1c128c"
        } else {
          ctx.fillStyle = "#5c3b91"
        }
        ctx.strokeStyle = "black"
        ctx.fill()
        ctx.stroke()
      }
    }
  }
}

function drawPowerUp() {
  powerUp.x - powerUp.width/2
  powerUp.y - (powerUp.width/3)/2

  ctx.beginPath()
  ctx.rect(powerUp.x, powerUp.y, powerUp.width, powerUp.width/3)
  ctx.rect(powerUp.x + powerUp.width/3, powerUp.y - powerUp.width/3, powerUp.width/3, powerUp.width)
  if (powerUpType === "noDeflect") {
    ctx.fillStyle = "red"
  } else {
    ctx.fillStyle = "yellow"
  }
  ctx.fill()
}

// for each block still visible, check for a collision with the ball
function blockHit() {
  for (i = 0; i < block.colSize; i ++) {
    for (j = 0; j < block.rowSize; j ++) {
      var cur = blocks[i][j]
      if (cur.visible) {
        if (ball.x + ball.radius >= cur.x && ball.x - ball.radius <= cur.x + block.width
          && ball.y - ball.radius <= cur.y + block.height && ball.y + ball.radius >= cur.y) {

          if (!powerUpActive || powerUpType !== "noDeflect") {
            // check the location of the ball in the previous frame to determine deflection direction
            if ((ball.x + ball.radius - ball.xVelocity < cur.x || ball.x - ball.radius - ball.xVelocity > cur.x + block.width)
            && Math.abs(ball.xVelocity) > 0) {
              ball.xVelocity *= -1
            } else {
              ball.yVelocity *= -1
            }
          }

          if (cur.hitsToBreak === 1 || (powerUpActive && powerUpType === "noDeflect")) {
            cur.visible = false
            blocksDestroyed ++

            if (blocksDestroyed === powerUpSpawn) {
              powerUp.x = cur.x + block.width/2
              powerUp.y = cur.y + block.height/2
              powerUp.visible = true
            }
          } else {
            cur.hitsToBreak --
          }
          return
        }
      }
    }
  }
}

function paddleHit() {
  if (ball.x + ball.radius >= paddle.x && ball.x - ball.radius <= paddle.x + paddle.width
    && ball.y + ball.radius > paddle.y && ball.y <= paddle.y + paddle.height/2) {

    var a = Math.pow(ball.xVelocity, 2)
    // speed up the ball by 0.25 in the y direction every paddle hit
    var b = Math.pow(ball.yVelocity + 0.25, 2)
    var totalSpeed = Math.sqrt(a + b)

    // map each position on the paddle to a unique angle
    var range = Math.PI/2 - Math.PI/5
    if (ball.x < paddle.x + paddle.width/2) {
      var ratio = (ball.x - paddle.x)/(paddle.width/2)
      var newAngle = ratio*range + Math.PI/5
      ball.xVelocity = -totalSpeed*Math.cos(newAngle)
      ball.yVelocity = -totalSpeed*Math.sin(newAngle)
    } else {
      var ratio = (ball.x - paddle.x - paddle.width/2)/(paddle.width/2)
      var newAngle = Math.PI/2 - ratio*range
      ball.xVelocity = totalSpeed*Math.cos(newAngle)
      ball.yVelocity = -totalSpeed*Math.sin(newAngle)
    }

    if (powerUpActive) {
      paddleHitsSincePowerUp ++
    }
  }
}

function powerUpHit() {
  if (powerUp.visible) {
    // collision detection for falling power-up
    if (powerUp.x + powerUp.width/2 >= paddle.x - paddle.cornerRadius
      && powerUp.x - powerUp.width/2 <= paddle.x + paddle.width + paddle.cornerRadius
      && powerUp.y + powerUp.width/2 >= paddle.y
      && powerUp.y - powerUp.width/2 <= paddle.y + paddle.height) {

      if (powerUpType === "width") {
        paddle.width += 100
        paddle.x -= 50
      }

      powerUp.visible = false
      powerUpActive = true

      // power-up has fallen out of canvas
    } else if (powerUp.y >= canvas.height) {
      powerUp.visible = false
    } else {
      drawPowerUp()
      powerUp.y += powerUp.velocity
    }
  }
}

function wallHit() {
  // left or right wall
  if (ball.x + ball.radius >= canvas.width || ball.x - ball.radius <= 0) {
    ball.xVelocity *= -1
    // if ball is still past a left or right wall in the next frame, it will get stuck
    if (ball.x + ball.radius + ball.xVelocity >= canvas.width) {
      // make it jump back into the canvas
      ball.x = canvas.width - ball.radius - 1
    } else if (ball.x - ball.radius + ball.xVelocity <= 0) {
      ball.x = ball.radius + 1
    }
  }

  // top or bottom wall
  if (ball.y - ball.radius <= 0) {
    ball.yVelocity *= -1
  } else if (ball.y + ball.radius >= canvas.height) {
    // life lost or game over
    ball.prevXVelocity = ball.xVelocity
    ball.prevYVelocity = ball.yVelocity
    lives --
    if (lives === 0) {
      alert("GAME OVER!")
      document.location.reload()
    } else {
      reset()
    }
  }
}

function drawInfo() {
  ctx.font = "15px Arial"
  ctx.fillStyle = "white"
  ctx.fillText("Level: " + level + "/3", 5, canvas.height - 5)
  ctx.fillText("Lives: " + lives, canvas.width - 55, canvas.height - 5)
}

function reset() {
  paddle.width = 75
  ball.x = canvas.width/2
  ball.y = paddle.y - ball.radius
  ball.xVelocity = 0
  ball.yVelocity = 0
  paddle.x = (canvas.width - paddle.width)/2
  spacePressed = false
  allowSpace = true
  paddleHitsSincePowerUp = 0
  powerUpActive = false
  powerUp.visible = false
}

// main recursive function that executes rendering of each frame
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  wallHit()
  paddleHit()
  blockHit()
  powerUpHit()

  drawBall()
  drawPaddle()
  drawblocks()
  drawInfo()

  if (paddleHitsSincePowerUp === powerUpHitsMax && powerUpActive) {
    if (powerUpType === "width") {
      paddle.width = 75
      paddle.x += 50
    }
    powerUpActive = false
    paddleHitsSincePowerUp = 0
  }

  if (blocksDestroyed === blocksToWin) {
    if (level === 3) {
      alert("YOU WIN!")
      document.location.reload()
    } else {
      reset()
      lives = 3
      blocksDestroyed = 0
      ball.prevXVelocity = 3
      ball.prevYVelocity = -3

      level ++
      newLevel(level)
    }
  }

  if (rightPressed && paddle.x < canvas.width - (paddle.width + paddle.cornerRadius)) {
    paddle.x += 7
    if (!spacePressed) {
      ball.x += 7
    }
  } else if (leftPressed && paddle.x - paddle.cornerRadius > 0) {
    paddle.x -= 7
    if (!spacePressed) {
      ball.x -= 7
    }
  }

  ball.x += ball.xVelocity
  ball.y += ball.yVelocity
  requestAnimationFrame(draw)
}
