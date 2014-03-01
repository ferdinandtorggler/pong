module.exports = {

    WIDTH:          100,
    HEIGHT:         100,

    HANDLE_HEIGHT:  10,
    HANDLE_WIDTH:   2,
    HANDLE_STEP:    2,

    SPEED:          .3,
    ACCELERATION:   .1,

    BALL_SIZE:      2,
    get BALL_START () {
        return   { x: this.WIDTH/2 - this.BALL_SIZE/2, y: this.HEIGHT/2 - this.BALL_SIZE/2 };
    }

};