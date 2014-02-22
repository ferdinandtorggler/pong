/*
 *  This module can manage multiple isolated games (or rooms) on the server.
 *
 *  Players can join rooms by navigating to different URLs. Everyone on the
 *  same URL is added to the same room (if the game instance allows it).
 *
 */

module.exports = function (io) {

    var Game  = require('../lib/game')(io),
        rooms = {};

    var getRoomNameOfPlayer = function (player) {
        var room;
        for(var k in io.sockets.manager.roomClients[player.id])
            if (k !== '') room = k;   // a socket is in the global room ('') as well.
        return room ? room.replace('/', '') : false;
    };

    return {

        getRoomOfPlayer: function (player) {
            return rooms[getRoomNameOfPlayer(player)];
        },

        addPlayerToRoom: function (player, roomName) {
            if (roomName) {
                if (!rooms[roomName]) rooms[roomName] = new Game(roomName);
                rooms[roomName].addPlayer(player);
            }
        },

        removePlayerFromRoom: function (player) {
            var roomName = getRoomNameOfPlayer(player);
            if (roomName) {
                rooms[roomName].removePlayer(player);
                if (rooms[roomName].isEmpty()) delete rooms[roomName];
            }
        }
    };

};
