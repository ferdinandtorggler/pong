module.exports = function (io) {

      return function (room) {

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

          gameloop,

          client1,
          client2,

          room = room;


        var startData = function (player) {
            return { handleHeight: HANDLE_HEIGHT,
                handleWidth: HANDLE_WIDTH,
                ballSize: BALL_SIZE,
                player: player
            };
        };


        var moveHandle = function (player, amount) {
            setHandle(player, player.y + amount);
        };

        var setHandle = function (player, y) {
            player.y = y;

            if (player.y < 0) player.y = 0;
            if (player.y + HANDLE_HEIGHT > HEIGHT) player.y = HEIGHT - HANDLE_HEIGHT;
            sendHandlePositions();
        };

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
            io.sockets.in(room).emit('handle positions', {player1: player1.y, player2: player2.y});
        };

        var bounceBackOnWallCollision = function () {
            if (ball.y <= 0 || ball.y + BALL_SIZE >= HEIGHT) {
                offset.y = -offset.y;
                io.sockets.in(room).emit('wall touched');
            }
        };

        var updateScoreIfScored = function () {
            // when the ball reaches the left end, player 2 scores
            if (ball.x <= 0) {
                score.player2 += 1;
                io.sockets.in(room).emit('score', score);
                newBall();
            }

            // when the ball reaches the right end, player 1 scores
            if (ball.x + BALL_SIZE >= WIDTH) {
                score.player1 += 1;
                io.sockets.in(room).emit('score', score);
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
                io.sockets.in(room).emit('handle touched');
            }

        };

        var tick = function () {

            ball.x += offset.x;
            ball.y += offset.y;

            bounceBackOnHit();
            bounceBackOnWallCollision();
            updateScoreIfScored();

            io.sockets.in(room).emit('ball move', { x: ball.x, y: ball.y });
        };

        this.moveHandleUp = function (player) {
            moveHandle(((player === 1) ? player1 : player2), -HANDLE_STEP);
        };

        this.moveHandleDown = function (player) {
            moveHandle(((player === 1) ? player1 : player2), HANDLE_STEP);
        };

        this.moveHandleToPosition = function (data) {
            setHandle(((data.player === 1) ? player1 : player2), data.y);
        };

        this.addPlayer = function (socket) {
            if (!client1) {
                client1 = socket;
                socket.emit('game data', startData(1));
                socket.join(room);
                sendHandlePositions();
            } else if (!client2) {
                client2 = socket;
                socket.emit('game data', startData(2));
                socket.join(room);
                sendHandlePositions();

                if (!gameloop && client1 && client2) {
                    io.sockets.in(room).emit('start game');
                    newBall();
                    gameloop = setInterval(tick, 1000/60);
                }

            } else {
                return false;
            }
        };


    };


};
