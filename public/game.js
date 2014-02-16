document.addEventListener('DOMContentLoaded', function () {

    var
      socket    = io.connect(),

      stage     = document.getElementById('game'),

      player1   = document.getElementById('player1'),
      player2   = document.getElementById('player2'),
      ball      = document.getElementById('ball'),

      score1    = document.getElementById('score1'),
      score2    = document.getElementById('score2'),

      size      = window.innerWidth > innerHeight ? innerHeight : innerWidth,
      scale     = size / 100,

      me;

    // set up stage
    stage.style.width = size + 'px';
    stage.style.height = size + 'px';


    // set up sound
    var beep;
    if (window.HTMLAudioElement) {
        beep = new Audio('');
        if(beep.canPlayType('audio/wav')) {
            beep = new Audio('/beep.wav');
        }
    }

    // converts abstract server units to screen pixels
    var toPixels = function (val) {
        return Math.round(val * scale);
    };

    socket.on('start game', function () {
        document.getElementById('waiting').classList.add('hidden');
    });

    socket.on('game data', function (data) {

        me = data.player;
        ((me === 1) ?  player1 : player2).classList.add('me');

        player1.style.width     = toPixels(data.handleWidth) + 'px';
        player1.style.height    = toPixels(data.handleHeight) + 'px';

        player2.style.width     = toPixels(data.handleWidth) + 'px';
        player2.style.height    = toPixels(data.handleHeight) + 'px';

        ball.style.width        = toPixels(data.ballSize) + 'px';
        ball.style.height       = toPixels(data.ballSize) + 'px';
    });

    socket.on('handle positions', function (data) {
        player1.style.top = toPixels(data.player1) + 'px';
        player2.style.top = toPixels(data.player2) + 'px';
    });

    socket.on('ball move', function (data) {
        ball.style.left = toPixels(data.x) + 'px';
        ball.style.top = toPixels(data.y) + 'px';
    });

    socket.on('score', function (data) {
        score1.innerText = data.player1;
        score2.innerText = data.player2;
    });

    socket.on('handle touched', function () {
        beep.play();
    });

    var keyboardControls = function (e) {
        switch (e.keyCode) {
            case 38: {
                socket.emit('move handle up', me);
                break;
            }
            case 40: {
                socket.emit('move handle down', me);
                break;
            }
        }
    };

    var oldX = 0;
    var mouseControls = function (e) {
        var HANDLE_STEP = toPixels(1);
        var y = e.clientY;
        var diff = y - oldX;
        if (oldX === 0) oldX = y;
        if (diff >= HANDLE_STEP) {
            socket.emit('move handle down', {player: me, amount: diff / scale * 1.25});
            oldX = y;
        }
        if (diff < 0 && -diff >= HANDLE_STEP) {
            socket.emit('move handle up', {player: me, amount: diff / scale * 1.25});
            oldX = y;
        }
    };

    document.addEventListener('keydown', keyboardControls);
    document.addEventListener('mousemove', mouseControls);
});
