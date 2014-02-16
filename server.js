"use strict";

var
  express   = require('express'),
  socketIO  = require('socket.io'),
  jade      = require('jade'),
  app       = express(),

  client1,
  client2;


// setting up express

app.configure (function () {
    app.use(express.static('public'));
});

app.get('/', function(req, res) {
    res.render('index.jade');
});


// setting up socket.io

var io = socketIO.listen(app.listen(process.env.PORT || 3000));
io.set('log level', 1);


var
  WIDTH           = 100,
  HEIGHT          = 100,

  BALL_SIZE       = 2,
  BALL_START    = { x: WIDTH/2 - BALL_SIZE/2, y: HEIGHT/2 - BALL_SIZE/2 },
  HANDLE_HEIGHT   = 10,
  HANDLE_WIDTH    = 2,
  HANDLE_STEP     = 2,

  SPEED           = .3,
  ACCELERATION    = .1,

  ball            = { x: 0, y: 0 },
  offset          = { x: 0, y: 0 },

  player1         = { y: HEIGHT/2 - HANDLE_HEIGHT/2 },
  player2         = { y: HEIGHT/2 - HANDLE_HEIGHT/2 },

  score           = { player1: 0, player2: 0 },

  gameloop;


var newBall = function () {
    offset.x = SPEED;
    offset.y = SPEED;
    if (Math.random() > 0.5) offset.x = -offset.x;
    if (Math.random() > 0.5) offset.y = -offset.y;
    ball.x = BALL_START.x;
    ball.y = BALL_START.y;
};

var resetGame = function () {
    clearInterval(gameloop);
    gameloop = undefined;
    client1 = undefined;
    client2 = undefined;
    player1 = {y: HEIGHT/2 - HANDLE_HEIGHT/2};
    player2 = {y: HEIGHT/2 - HANDLE_HEIGHT/2};
    score = {player1: 0, player2: 0};
    newBall()
};

var sendHandlePositions = function () {
    io.sockets.emit('handle positions', {player1: player1.y, player2: player2.y});
};

var bounceBackOnWallCollision = function () {
    if (ball.y <= 0 || ball.y + BALL_SIZE >= HEIGHT) {
        offset.y = -offset.y;
        io.sockets.emit('wall touched');
    }
};

var updateScoreIfScored = function () {
    // when the ball reaches the left end, player 2 scores
    if (ball.x <= 0) {
        score.player2 += 1;
        io.sockets.emit('score', score);
        newBall();
    }

    // when the ball reaches the right end, player 1 scores
    if (ball.x + BALL_SIZE >= WIDTH) {
        score.player1 += 1;
        io.sockets.emit('score', score);
        newBall();
    }
};

var bounceBackOnHit = function () {

    var player1Touches = ( (ball.x <= HANDLE_WIDTH)
                        && (ball.y + BALL_SIZE >= player1.y)
                        && (ball.y <= player1.y + HANDLE_HEIGHT));

    var player2Touches = ( (ball.x + BALL_SIZE >= (WIDTH - HANDLE_WIDTH))
                        && (ball.y + BALL_SIZE >= player2.y)
                        && (ball.y <= player2.y + HANDLE_HEIGHT));


    if (player1Touches || player2Touches) {

        // accelerate ball in random direction
        if (offset.x < 2) {
            offset.x += (offset.x < 0) ? -ACCELERATION : ACCELERATION;
            offset.y = SPEED * 2 * Math.random(); // arithmetic mean is SPEED
        }

        offset.x = -offset.x;
        io.sockets.emit('handle touched');
    }

};


io.sockets.on('connection', function (socket) {

    var startData = function (player) {
        return { handleHeight: HANDLE_HEIGHT,
                 handleWidth: HANDLE_WIDTH,
                 ballSize: BALL_SIZE,
                 player: player
               };
    };

    if (client1 === undefined) {
        client1 = socket;
        socket.emit('game data', startData(1));
        sendHandlePositions();
    } else if (client2 === undefined) {
        client2 = socket;
        socket.emit('game data', startData(2));
        sendHandlePositions();
    } else {
        resetGame();
    }

    var moveHandle = function (player, amount) {
        setHandle(player, player.y + amount);
    };

    var setHandle = function (player, y) {
        player.y = y;

        if (player.y < 0) player.y = 0;
        if (player.y + HANDLE_HEIGHT > HEIGHT) player.y = HEIGHT - HANDLE_HEIGHT;
        sendHandlePositions();
    };

    socket.on('move handle up', function (player) {
        moveHandle(((player === 1) ? player1 : player2), -HANDLE_STEP);
    });

    socket.on('move handle down', function (player) {
        moveHandle(((player === 1) ? player1 : player2), HANDLE_STEP);
    });

    socket.on('move handle', function (data) {
        setHandle(((data.player === 1) ? player1 : player2), data.y);
    });

    var tick = function () {

        ball.x += offset.x;
        ball.y += offset.y;

        bounceBackOnHit();
        bounceBackOnWallCollision();
        updateScoreIfScored();

        io.sockets.emit('ball move', { x: ball.x, y: ball.y });
    };

    newBall();

    if (!gameloop && client1 && client2) {
        io.sockets.emit('start game');
        newBall();
        gameloop = setInterval(tick, 1000/60);
    }

    socket.on('disconnect', function () {
        resetGame();
    });

});