"use strict";

var
  express = require('express'),
  socketIO = require('socket.io'),
  jade = require('jade'),
  app = express();

var player1, player2;

app.configure (function () {
    app.use(express.static('public'));
});

app.get('/', function(req, res) {
    res.render('index.jade');
});


var io = socketIO.listen(app.listen(3000));
io.set('log level', 1);

io.sockets.on('connection', function (socket) {

    var ballX,
        ballY,
        xOffset = 1,
        yOffset = 1,
        gameloop;

    if (player1 === undefined) {
        player1 = true;
        socket.emit('player', {player: 1});
    } else if (player2 === undefined) {
        player2 = true;
        socket.emit('player', {player: 2});
    } else {
        clearInterval(gameloop);
        gameloop = undefined;
        player1 = undefined;
        player2 = undefined;
    }

    if (player1 && player2) {

        socket.on('ballposition', function (data) {

            if (!gameloop) {

                console.log('Starting game...');

                if (ballX === undefined && ballY === undefined) {
                    ballX = data.x;
                    ballY = data.y;
                }

                if (Math.random() > 0.5) xOffset = -xOffset;
                if (Math.random() > 0.5) yOffset = -yOffset;

                console.log(xOffset, yOffset);

                gameloop = setInterval( function () {
                    ballX += xOffset;
                    ballY += yOffset;
                    io.sockets.emit('ballmove', { x: ballX, y: ballY });
                }, 1000/60);

                console.log('Started!');
            }

        });

    }

    socket.on('hit handle', function () {
        xOffset = -xOffset;
        console.log('Ball hit a handle!');
    });

    socket.on('hit wall', function () {
        yOffset = -yOffset;
    });

    socket.on('game over', function () {
        clearInterval(gameloop);
    });

    socket.on('user handle change', function (data) {
        socket.broadcast.emit('handle change', data);
    });

});