module.exports = function (io) {

    var Game  = require('../lib/game')(io),
        rooms = {};

    return {
        getRoomOfPlayer: function (player) {
            var room;
            for(var k in io.sockets.manager.roomClients[player.id])
                if (k !== '') room = k;
            return rooms[room.replace('/', '')];
        },

        addPlayerToRoom: function (player, roomName) {
            if (roomName) {
                if (!rooms[roomName]) rooms[roomName] = new Game(roomName);
                rooms[roomName].addPlayer(player);
            }
        }
    };

};

