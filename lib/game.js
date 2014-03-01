var Field = require('../lib/field');
var props = require('../lib/game_props');

module.exports = function (io) {

    return function (roomName) {

        var field = new Field();
        var gameloop;
        var client1;
        var client2;
        var score = {
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


        field.on('wall touched', function () {
            io.sockets.in(roomName).emit('wall touched');
        });

        field.on('score', function (playerNum) {
            if (playerNum === 1)
                score.player1 += 1;
            else
                score.player2 += 1;

            io.sockets.in(roomName).emit('score', score);
        });

        field.on('handle touched', function () {
            io.sockets.in(roomName).emit('handle touched');
        });

        var tick = function () {

            field.moveBall();

            var ball = field.getBallPosition();
            var handles = field.getHandlePositions();
            io.sockets.in(roomName).emit('update field', [ball.x, ball.y, handles.player1, handles.player2]);

        };

        var registerSocketHandlers = function (socket) {
            socket.on( 'move handle up',     function (data) { field.moveHandle(data.player, -props.HANDLE_STEP); });
            socket.on( 'move handle down',   function (data) { field.moveHandle(data.player, props.HANDLE_STEP); });
            socket.on( 'move handle',        function (data) { field.setHandle(data.player, data.y); });
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
