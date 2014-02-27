var Field = require('../lib/field');
var props = require('../lib/game_props');

module.exports = function (io) {

    return function (roomName) {

        var
          field = new Field(),
          gameloop,
          score = {
              player1: 0,
              player2: 0
          };

        var startGame = function () {
            if (!gameloop) {
                field.newBall();
                io.sockets.in(roomName).emit('start game');
                gameloop = setInterval(tick, 1000/60);
            }
        };

        var stopGame = function () {
            clearInterval(gameloop);
            gameloop = undefined;
            io.sockets.in(roomName).emit('score', score);
            field.resetHandles();
        };


        field.on('handlepositions', function (data) {
            io.sockets.in(roomName).emit('handle positions', data);
        });

        field.on('walltouched', function () {
            io.sockets.in(roomName).emit('wall touched');
        });

        field.on('score', function (playerNum) {
            if (playerNum === 1)
                score.player1 += 1;
            else
                score.player2 += 1;

            io.sockets.in(roomName).emit('score', score);
        });

        field.on('handletouched', function () {
            io.sockets.in(roomName).emit('handle touched');
        });

        var tick = function () {

            field.moveBall();
            field.bounceBackOnHit();
            field.bounceBackOnWallCollision();
            field.updateScoreIfScored();

            // TODO send array instead
            io.sockets.in(roomName).emit('ball move', field.getBallPosition());
            io.sockets.in(roomName).emit('handle positions', field.getHandlePositions());

        };

        var
          client1,
          client2;

        var registerSocketHandlers = function (socket) {
            socket.on( 'move handle up',     function (data) { field.moveHandleUp(data); });
            socket.on( 'move handle down',   function (data) { field.moveHandleDown(data); });
            socket.on( 'move handle',        function (data) { field.moveHandleToPosition(data); });
        };

        this.moveHandleUp = function (d) {
            field.moveHandleUp(d)
        };

        this.moveHandleDown = function (d) {
            field.moveHandleDown(d)
        };

        this.moveHandleToPosition = function (d) {
            field.moveHandleToPosition(d)
        };

        this.addPlayer = function (socket) {
            var startData = {
                handleHeight: props.HANDLE_HEIGHT,
                handleWidth: props.HANDLE_WIDTH,
                ballSize: props.BALL_SIZE
            };
            if (!client1) {
                client1 = socket;
                startData['player'] = 1;
            } else if (!client2) {
                client2 = socket;
                startData['player'] = 2;
            } else {
                return false;
            }

            registerSocketHandlers(socket);
            socket.emit('game data', startData);

            socket.join(roomName);
            io.sockets.in(roomName).emit('handle positions', field.getHandlePositions());
            if (client1 && client2) startGame();
        };

        this.removePlayer = function (socket) {
            if (client1 === socket)
                client1 = undefined;
            else if (client2 === socket)
                client2 = undefined;
            stopGame();
        };

        this.isEmpty = function () {
            return !(client1 || client2)
        };
    };
};
