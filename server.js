"use strict";

var
  express = require('express'),
  socketIO = require('socket.io'),
  jade = require('jade'),
  app = express(),

  client1,
  client2;

app.configure (function () {
    app.use(express.static('public'));
});

app.get('/', function(req, res) {
    res.render('index.jade');
});


var io = socketIO.listen(app.listen(process.env.PORT || 3000));
io.set('log level', 1);


var
  ball = {x: 0, y: 0},
  offset = {x: 0, y: 0},

  handleHeight  = 10,
  handleWidth   = 2,
  ballSize    = 2,

  width  = 100,
  height = 100,

  player1 = {height: height/2 - handleHeight/2},
  player2 = {height: height/2 - handleHeight/2},

  ballposition = {x: width/2 - ballSize/2, y: height/2 - ballSize/2},
  score = {player1: 0, player2: 0},

  gameloop,

  SPEED = .1;

io.sockets.on('connection', function (socket) {

    var resetBallPosition = function () {
        ball.x = ballposition.x;
        ball.y = ballposition.y;
    };

    var resetGame = function () {
        console.log('stopping game...');
        player1 = {height: height/2 - handleHeight/2};
        player2 = {height: height/2 - handleHeight/2};
        ball = {x: 0, y: 0};
        offset = {x: 0, y: 0};
        score = {player1: 0, player2: 0};
        clearInterval(gameloop);
        gameloop = undefined;
        client1 = undefined;
        client2 = undefined;
    };

    var resetBall = function () {
        offset.x = SPEED;
        offset.y = SPEED;
        if (Math.random() > 0.5) offset.x = -offset.x;
        if (Math.random() > 0.5) offset.y = -offset.y;
        resetBallPosition();
    };

    var metaData = function (player) {
        return { handleHeight: handleHeight,
                 handleWidth: handleWidth,
                 ballSize: ballSize,
                 player: player
               };
    };

    if (client1 === undefined) {
        client1 = socket;
        socket.emit('player', metaData(1));
        io.sockets.emit('handle positions', {player1: player1.height, player2: player2.height});
    } else if (client2 === undefined) {
        client2 = socket;
        socket.emit('player', metaData(2));
        io.sockets.emit('handle positions', {player1: player1.height, player2: player2.height});
    } else {
        resetGame();
    }

    var moveHandle = function (player, amount) {
        if (player.height <= 0 && amount < 0 || player.height + handleHeight >= height && amount > 0) return;
            player.height += amount;

        // correct game field exceeding caused by non-pixel-value amounts
        if (player.height < 0) player.height = 0;
        if (player.height + handleHeight > height) player.height = height - handleHeight;
    };

    socket.on('move handle up', function (data) {
        moveHandle(((data.player === 1) ? player1 : player2), -2);
        io.sockets.emit('handle positions', {player1: player1.height, player2: player2.height});
    });

    socket.on('move handle down', function (data) {
        moveHandle(((data.player === 1) ? player1 : player2), 2);
        io.sockets.emit('handle positions', {player1: player1.height, player2: player2.height});
    });

    var tick = function () {
        ball.x += offset.x;
        ball.y += offset.y;

        var player1Touches = ( (ball.x <= handleWidth)
                            && (ball.y + ballSize >= player1.height)
                            && (ball.y <= player1.height + handleHeight));

        var player2Touches = ( (ball.x + ballSize >= (width - handleWidth))
                            && (ball.y + ballSize >= player2.height)
                            && (ball.y <= player2.height + handleHeight));


        if (player1Touches || player2Touches) {

            // accelerate ball
            var amount = 0.1;
            if (offset.x < 2) {
                offset.x += (offset.x < 0) ? -amount : amount;
                var direction = Math.random();
                if (direction < .16667)
                    offset.y = -offset.y*2;
                else if (direction < .33333)
                    offset.y = -offset.y;
                else if (direction < .5)
                    offset.y = -offset.y/2;
                else if (direction < .66667)
                    offset.y = offset.y/2;
                else if (direction < .83333)
                    offset.y = offset.y*2;
            }

            offset.x = -offset.x;
            io.sockets.emit('beep');
        }

        if (ball.y <= 0 || ball.y + ballSize >= height) {
            offset.y = -offset.y;
        }

        if (ball.x <= 0) {
            score.player2 += 1;
            io.sockets.emit('score', score);
            resetBall();
        }

        if (ball.x + ballSize >= width) {
            score.player1 += 1;
            io.sockets.emit('score', score);
            resetBall();
        }

        io.sockets.emit('ballmove', { x: ball.x, y: ball.y });
    };

    resetBall();

    if (!gameloop && client1 && client2) {
        console.log('players connected, starting game...');

        resetBall();

        gameloop = setInterval(tick, 1000/60);
    }

    socket.on('disconnect', function () {
        resetGame();
    });

});