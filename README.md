# Pong

This is a multiplayer implementation of the old Atari Pong game.
Multiple pairs of players can play simultaneously on the server.

It is hosted on [socketpong.herokuapp.com](http://socketpong.herokuapp.com) and can be played there.

##Gameplay
When a user connects to the server (visits the start page), they will see a page displaying a link to the game room. They share the link with their opponent and once both of them reached that url, the game will start.

The players control the racquets with the arrow keys on the keyboard or with the mouse.

##Technology
The backend is done using Node.js and Express.
The simulation (collision detection and movement of the ball) is running on the server which sends the state of the game 60 times per second.

The communication between server and client happens through a websocket connection implemented with socket.io. This library is also capable of partitioning connected clients into rooms, which is used to create the multiple-rooms-logic.

The frontend is very simple, it only represents the state of the game on the server and sends information about the racquet movements.
