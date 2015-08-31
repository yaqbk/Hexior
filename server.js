var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

var players = [];
var iterator = 0;
var hexy = [];

var roundTime = 20;
var time = roundTime;
var timer = setInterval(function() {
	if(time < 0) {
		time = roundTime;
		iterator++;
		if(iterator > players.length - 1) iterator = 0; 
		if(players.length > 0) io.emit('change', JSON.stringify(players[iterator]));
		}
	io.emit('time', time);
	time--;
	},1000);

app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res){
  //res.sendFile('index.html', { root: path.join(__dirname, '/')});
  res.sendfile('hexior.html');
});

function isPlayer(player) {
	for(var i = 0; i < players.length; i++) {
		if(players[i].name == player.name) return true;
	}
	return false;
}

function Player(socketId, name, color) {
	this.socketId = socketId;
	this.name = name;
	this.color = color;
}

function Hexy(type, color, player, army) {
	this.type = type;
	this.color = color;
	this.player = player;
	this.army = army;
}

function find(id) {
	for(var i = 0; i < players.length; i++) {
		if(players[i].socketId == id) return i;
	}
	return -1;
}


io.on('connection', function(socket) {
	socket.on('welcome', function(obj) {
	
		var player = JSON.parse(obj)[0];
		var board = JSON.parse(obj)[1];
		var p = JSON.parse(player);
	  	if(!isPlayer(p)) {
	  		players.push(new Player(socket.id, p.name, p.color));
	  	}
	  	
	  	if(players.length > 0) io.emit('change', JSON.stringify(players[iterator]));
	  	
	  	var b;
	  	
	  	if(hexy.length == 0) {
	  		hexy = [];
	  		for(var i = 0; i < board.length; i++) {
	  			b = JSON.parse(board[i]);
	  			hexy.push(JSON.stringify(new Hexy(b.type, b.color, b.player, b.army)));
	  		}
	  		time = roundTime;
	  	} else {
	  		var msg = [JSON.stringify(p), hexy];
	  		io.emit('shareBoard', JSON.stringify(msg));
	  	}
	  	
	  	
	  	var info = [p.name, players.length];
	  	io.emit('info', JSON.stringify(info));
	});
	
  	socket.on('message', function(obj) {
  		var msg = JSON.parse(obj);
 		
 		var tempH = JSON.parse(hexy[msg.index]);
  		tempH.army = msg.army;
  		tempH.player = msg.player;
  		tempH.color = JSON.parse(msg.player).color;
  		hexy[msg.index] = JSON.stringify(tempH);
  		
	  	io.emit('message', obj);
  	});
  
  socket.on('disconnect', function() {
  	var k = find(socket.id);
  	if(k != -1) {
  		console.log("user disconnected " + socket.id);
  		players.splice(k, 1);
  		time = roundTime;
		if(iterator > players.length - 1) iterator = 0; 
		if(players.length > 0) {
			io.emit('change', JSON.stringify(players[iterator]));
		} else {
			hexy = [];
			}
  	}
  });

});

//server_port, server_ip_address,
http.listen(3000, function(){
  console.log("Listening on " + server_ip_address + ", server_port " + server_port);
});
