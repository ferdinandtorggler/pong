"use strict";

var
  express   = require('express'),
  socketIO  = require('socket.io'),
  jade      = require('jade'),
  app       = express(),

  roomName;


/*
 *  SETTING UP EXPRESS ROUTES
 */

app.configure (function () {
    app.use(express.static('public'));
});

app.get('/', function(req, res) {
    res.render('index.jade');
});

app.get('/room/:room', function (req, res) {
    roomName = req.params.room;
    res.render('game.jade');
});


/*
 *  SETTING UP SOCKET.IO
 */

var io = socketIO.listen(app.listen(process.env.PORT || 3000));
io.set('log level', 1);

var rooms = require('./lib/rooms')(io);

io.sockets.on('connection', function (socket) {

    rooms.addPlayerToRoom(socket, roomName);

    socket.on( 'move handle up',     function (data) { rooms.getRoomOfPlayer(socket).moveHandleUp(data); });
    socket.on( 'move handle down',   function (data) { rooms.getRoomOfPlayer(socket).moveHandleDown(data); });
    socket.on( 'move handle',        function (data) { rooms.getRoomOfPlayer(socket).moveHandleToPosition(data); });

    socket.on( 'disconnect',         function () { rooms.removePlayerFromRoom(socket); });

});