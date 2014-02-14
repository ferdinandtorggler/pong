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
        xOffset,
        yOffset,
        gameloop,
        ballposition,
        score = {player1: 0, player2: 0};

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

    var startGame = function (ballposition) {

        // reset speed
        xOffset = 1;
        yOffset = 1;

        if (!gameloop && player1 && player2) {

            if (ballX === undefined && ballY === undefined) {
                ballX = ballposition.x;
                ballY = ballposition.y;
            }

            if (Math.random() > 0.5) xOffset = -xOffset;
            if (Math.random() > 0.5) yOffset = -yOffset;

            gameloop = setInterval( function () {
                ballX += xOffset;
                ballY += yOffset;
                io.sockets.emit('ballmove', { x: ballX, y: ballY });
            }, 1000/60);
        }
    };

    var resetBall = function () {
        xOffset = 1;
        yOffset = 1;
        if (Math.random() > 0.5) xOffset = -xOffset;
        if (Math.random() > 0.5) yOffset = -yOffset;
        ballX = ballposition.x;
        ballY = ballposition.y;
    };

    socket.on('ballposition', function (data) {
        ballposition = data;
        startGame(ballposition);
    });

    socket.on('hit handle', function () {

        // accelerate ball
        xOffset += (xOffset * 0.25);
        yOffset += (yOffset * 0.25);

        xOffset = -xOffset;
    });

    socket.on('hit wall', function () {
        yOffset = -yOffset;
    });

    socket.on('scored', function (data) {
        score['player' + data.player] += 1;
        io.sockets.emit('score', score);
        resetBall();
    });

    socket.on('user handle change', function (data) {
        socket.broadcast.emit('handle change', data);
    });

    socket.on('disconnect', function () {
        console.log('resetting everything');
        clearInterval(gameloop);
        player1 = undefined;
        player2 = undefined;
        gameloop = undefined;
    });

});