var util = require('util');
var EventEmitter = require('events').EventEmitter;
var props = require('../lib/game_props');

var Field = function () {

    var handle1         = { y: props.HEIGHT/2 - props.HANDLE_HEIGHT/2 };
    var handle2         = { y: props.HEIGHT/2 - props.HANDLE_HEIGHT/2 };

    var ball            = { x: 0, y: 0 };
    var offset          = { x: 0, y: 0 };

    var self = this;


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
        ball.x = props.BALL_START.x;
        ball.y = props.BALL_START.y;
        offset.x = props.SPEED;
        offset.y = props.SPEED;
        if (Math.random() > 0.5) offset.x = -offset.x;
        if (Math.random() > 0.5) offset.y = -offset.y;
    };

    this.resetHandles = function () {
        handle1 = {y: props.HEIGHT/2 - props.HANDLE_HEIGHT/2};
        handle2 = {y: props.HEIGHT/2 - props.HANDLE_HEIGHT/2};
    };

    this.moveBall = function () {
        ball.x += offset.x;
        ball.y += offset.y;

        bounceBackOnWallCollision();
        bounceBackOnHit();
        updateScoreIfScored();
    };

    var bounceBackOnWallCollision = function () {
        if (ball.y <= 0 || ball.y + props.BALL_SIZE >= props.HEIGHT) {
            offset.y = -offset.y;
            self.emit('wall touched');
        }
    };

    var updateScoreIfScored = function () {
        // when the ball reaches the left end, player 2 scores
        if (ball.x <= 0) {
            self.emit('score', 2);
            self.newBall();
        }

        // when the ball reaches the right end, player 1 scores
        if (ball.x + props.BALL_SIZE >= props.WIDTH) {
            self.emit('score', 1);
            self.newBall();
        }
    };

    var bounceBackOnHit = function () {

        var player1Touches = ( (ball.x <= props.HANDLE_WIDTH)
          && (ball.y + props.BALL_SIZE >= handle1.y)
          && (ball.y <= handle1.y + props.HANDLE_HEIGHT));

        var player2Touches = ( (ball.x + props.BALL_SIZE >= (props.WIDTH - props.HANDLE_WIDTH))
          && (ball.y + props.BALL_SIZE >= handle2.y)
          && (ball.y <= handle2.y + props.HANDLE_HEIGHT));


        if (player1Touches || player2Touches) {

            // accelerate ball in random direction
            if (offset.x < 2) {
                offset.x += (offset.x < 0) ? -props.ACCELERATION : props.ACCELERATION;
                offset.y = props.SPEED * 2 * Math.random(); // arithmetic mean is SPEED
            }

            offset.x = -offset.x;
            self.emit('handle touched');
        }

    };

    var getHandleByPlayerNumber = function (num) {
        return ((num === 1) ? handle1 : handle2);
    };

    this.setHandle = function (playerNumber, y) {
        var player = getHandleByPlayerNumber(playerNumber);
        player.y = y;

        if (player.y < 0) player.y = 0;
        if (player.y + props.HANDLE_HEIGHT > props.HEIGHT) player.y = props.HEIGHT - props.HANDLE_HEIGHT;
    };

    this.moveHandle = function (playerNumber, amount) {
        var player = getHandleByPlayerNumber(playerNumber);
        this.setHandle(player, player.y + amount);
    };

};

util.inherits(Field, EventEmitter);

module.exports = Field;