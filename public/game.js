document.addEventListener('DOMContentLoaded', function () {

    var
      socket        = io.connect(),

      game          = document.getElementById('game'),

      player1       = document.getElementById('player1'),
      player2       = document.getElementById('player2'),
      ball          = document.getElementById('ball'),

      score1       = document.getElementById('score1'),
      score2       = document.getElementById('score2'),

      me,

      width = window.innerWidth > innerHeight ? innerHeight : innerWidth,
      height = width;


    game.style.width = width + 'px';
    game.style.height = height + 'px';


    socket.on('player', function (data) {
        me = (data.player === 1) ?  player1 : player2;
        me.style.backgroundColor = '#FFFFFF';

        player1.style.width = data.handleWidth * widthScale + 'px';
        player2.style.width = data.handleWidth * widthScale + 'px';

        player1.style.height = data.handleHeight * heightScale + 'px';
        player2.style.height = data.handleHeight * heightScale + 'px';

        ball.style.width = data.ballSize * widthScale + 'px';
        ball.style.height = data.ballSize * heightScale + 'px';
    });

    var widthScale = width / 100;
    var heightScale = height / 100;

    var translateBallPosition = function (pos) {
        var x = Math.round(pos.x * widthScale);
        var y = Math.round(pos.y * heightScale);
        return {x: x, y: y};
    };

    var translateHandleHeights = function (pos) {
        var p1 = Math.round(pos.player1 * heightScale);
        var p2 = Math.round(pos.player2 * heightScale);
        return {player1: p1, player2: p2};
    };

    var handleListener = function (e) {
        switch (e.keyCode) {
            case 38: {
                socket.emit('move handle up', { player: ((me === player1) ? 1 : 2), amount: -2 });
                break;
            }
            case 40: {
                socket.emit('move handle down', { player: ((me === player1) ? 1 : 2), amount: 2  });
                break;
            }
        }
    };

    document.addEventListener('keydown', handleListener);

    socket.on('handle positions', function (data) {
        data = translateHandleHeights(data);
        player1.style.top = data.player1 + 'px';
        player2.style.top = data.player2 + 'px';
    });

    socket.on('ballmove', function (data) {
        data = translateBallPosition(data);
        ball.style.left = data.x + 'px';
        ball.style.top = data.y + 'px';
    });

    socket.on('score', function (data) {
        score1.innerText = data.player1;
        score2.innerText = data.player2;
    });

});