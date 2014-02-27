var util = require('util');
var EventEmitter = require('events').EventEmitter;
var props = require('../lib/game_props');

var Field = function () {

    var WIDTH           = props.WIDTH;
    var HEIGHT          = props.HEIGHT;

    var BALL_SIZE       = props.BALL_SIZE;
    var BALL_START      = { x: WIDTH/2 - BALL_SIZE/2, y: HEIGHT/2 - BALL_SIZE/2 };

    var HANDLE_HEIGHT   = props.HANDLE_HEIGHT;
    var HANDLE_WIDTH    = props.HANDLE_WIDTH;
    var HANDLE_STEP     = props.HANDLE_STEP;

    var SPEED           = props.SPEED;
    var ACCELERATION    = props.ACCELERATION;

    var handle1         = { y: HEIGHT/2 - HANDLE_HEIGHT/2 };
    var handle2         = { y: HEIGHT/2 - HANDLE_HEIGHT/2 };

    var ball            = { x: 0, y: 0 };
    var offset          = { x: 0, y: 0 };


    this.getHandlePositions = function () {
        return {
            player1: handle1.y,
            player2: handle2.y
        }
    };

    this.getBallPosition = function () {
        return ball;
    };

    this.newBall = function () {
        ball.x = BALL_START.x;
        ball.y = BALL_START.y;
        offset.x = SPEED;
        offset.y = SPEED;
        if (Math.random() > 0.5) offset.x = -offset.x;
        if (Math.random() > 0.5) offset.y = -offset.y;
    };

    this.resetHandles = function () {
        handle1 = {y: HEIGHT/2 - HANDLE_HEIGHT/2};
        handle2 = {y: HEIGHT/2 - HANDLE_HEIGHT/2};
    };

    this.moveBall = function () {
        ball.x += offset.x;
        ball.y += offset.y;
    };

    this.bounceBackOnWallCollision = function () {
        if (ball.y <= 0 || ball.y + BALL_SIZE >= HEIGHT) {
            offset.y = -offset.y;
            this.emit('walltouched');
        }
    };

    this.updateScoreIfScored = function () {
        // when the ball reaches the left end, player 2 scores
        if (ball.x <= 0) {
            this.emit('score', 2);
            this.newBall();
        }

        // when the ball reaches the right end, player 1 scores
        if (ball.x + BALL_SIZE >= WIDTH) {
            this.emit('score', 1);
            this.newBall();
        }
    };

    this.bounceBackOnHit = function () {

        var player1Touches = ( (ball.x <= HANDLE_WIDTH)
          && (ball.y + BALL_SIZE >= handle1.y)
          && (ball.y <= handle1.y + HANDLE_HEIGHT));

        var player2Touches = ( (ball.x + BALL_SIZE >= (WIDTH - HANDLE_WIDTH))
          && (ball.y + BALL_SIZE >= handle2.y)
          && (ball.y <= handle2.y + HANDLE_HEIGHT));


        if (player1Touches || player2Touches) {

            // accelerate ball in random direction
            if (offset.x < 2) {
                offset.x += (offset.x < 0) ? -ACCELERATION : ACCELERATION;
                offset.y = SPEED * 2 * Math.random(); // arithmetic mean is SPEED
            }

            offset.x = -offset.x;
            this.emit('handletouched');
        }

    };

    var getPlayerByNumber = function (num) {
        return ((num === 1) ? handle1 : handle2);
    };

    var setHandle = function (player, y) {
        player.y = y;

        if (player.y < 0) player.y = 0;
        if (player.y + HANDLE_HEIGHT > HEIGHT) player.y = HEIGHT - HANDLE_HEIGHT;
    };

    var moveHandle = function (player, amount) {
        setHandle(player, player.y + amount);
    };

    this.moveHandleUp = function (playerNum) {
        moveHandle(getPlayerByNumber(playerNum), -HANDLE_STEP);
    };

    this.moveHandleDown = function (playerNum) {
        moveHandle(getPlayerByNumber(playerNum), HANDLE_STEP);
    };

    this.moveHandleToPosition = function (data) {
        setHandle(getPlayerByNumber(data.player), data.y);
    };

};

util.inherits(Field, EventEmitter);

module.exports = Field;