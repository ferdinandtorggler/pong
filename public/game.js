(function (window) {

    var
      handleHeight  = 100,
      handleWidth   = 20,
      ballRadius    = 6,

      socket        = io.connect('http://localhost:3000'),

      player1       = document.getElementById('player1'),
      player2       = document.getElementById('player2'),
      ball          = document.getElementById('ball'),
      me;

    socket.on('player', function (data) {
        me = (data.player === 1) ?  player1 : player2;
        console.log('this is', me.id);
    });

    var
      width  = window.innerWidth,
      height = window.innerHeight;

    // must be available as inline styles
    player1.style.top   = height/2 + 'px';
    player2.style.top   = height/2 + 'px';

    ball.style.top      = height/2 + 'px';
    ball.style.left     = width/2  + 'px';

    var playerTop = function (player) {
        return parseInt(player.style.top, 10);
    };

    var setPlayerTop = function (player, top) {
        player.style.top = Math.floor(top) + 'px';
    };

    var setPlayerLeft = function (player, left) {
        player.style.left = Math.floor(left) + 'px';
    };

    var reportHandleChange = function () {
        var top = playerTop(me);
        var playerData = (me === player1) ? {player1: top} : {player2: top};
        socket.emit('user handle change', playerData);
    };

    var moveHandleUp = function (handle) {
        if (playerTop(me) - handleHeight/2 <= 0) return;
        setPlayerTop(handle, playerTop(handle) - 10);
        reportHandleChange();
    };

    var moveHandleDown = function (handle) {
        if (playerTop(me) + handleHeight/2 >= height) return;
        setPlayerTop(handle, playerTop(handle) + 10);
        reportHandleChange();
    };

    var handleListener = function (e) {
        switch (e.keyCode) {
            case 38: {
                moveHandleUp(me);
                break;
            }
            case 40: {
                moveHandleDown(me);
                break;
            }
            case 32: {
                socket.emit('game over');
                break;
            }
        }
    };

    document.addEventListener('keydown', handleListener);

    socket.emit('ballposition', {
        x: parseInt(ball.style.left, 10),
        y: parseInt(ball.style.top, 10)
    });

    socket.on('ballmove', function (data) {
        setPlayerTop(ball, data.y);
        setPlayerLeft(ball, data.x);

        var player1Touches = (  (data.x - ballRadius >= 0) && (data.x - ballRadius <= handleWidth + ballRadius)
                             && (data.y > playerTop(player1) - handleHeight/2)
                             && (data.y < (playerTop(player1) + handleHeight)));

        var player2Touches = (  (data.x + ballRadius >= (width - handleWidth)) && (data.x + ballRadius < width)
                                && (data.y > playerTop(player2) - handleHeight/2)
                                && (data.y < (playerTop(player2) + handleHeight)));

        if (player1Touches || player2Touches)
            socket.emit('hit handle');

        if (data.y <= ballRadius || data.y >= height - ballRadius)
            socket.emit('hit wall');

        if (data.x < ballRadius || data.x > width - ballRadius)
            socket.emit('game over');

    });

    socket.on('handle change', function (data) {
        if (data.player1) setPlayerTop(player1, data.player1);
        if (data.player2) setPlayerTop(player2, data.player2);
    });

})(window);