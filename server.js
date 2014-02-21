"use strict";

var
  express   = require('express'),
  socketIO  = require('socket.io'),
  jade      = require('jade'),
  app       = express(),

  room,
  rooms = {};


// setting up express

app.configure (function () {
    app.use(express.static('public'));
});

app.get('/', function(req, res) {
    res.render('index.jade');
});

app.get('/room/:room', function (req, res) {
    room = req.params.room;
    res.render('index.jade');
});


// setting up socket.io

var io = socketIO.listen(app.listen(process.env.PORT || 3000));
io.set('log level', 1);

var Game = require('./lib/game')(io);

var getGameOfPlayer = function (player) {
    var room;
    for(var k in io.sockets.manager.roomClients[player.id])
        if (k !== '') room = k;
    return rooms[room.replace('/', '')];
};

io.sockets.on('connection', function (socket) {

    if (room) {
        if (!rooms[room]) rooms[room] = new Game(room);
        rooms[room].addPlayer(socket);
    }

    socket.on('move handle up', function (data) { getGameOfPlayer(socket).moveHandleUp(data); });
    socket.on('move handle down', function (data) { getGameOfPlayer(socket).moveHandleDown(data); });
    socket.on('move handle', function (data) { getGameOfPlayer(socket).moveHandleToPosition(data); });

});