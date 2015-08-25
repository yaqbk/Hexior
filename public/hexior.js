var socket = io();

paper.install(window);


var yourName = "kuba";
//prompt("Your name");
window.onload = function() {

// Get a reference to the canvas object
var canvas = document.getElementById('myCanvas');
// Create an empty project and a view for the canvas:
paper.setup(canvas);
// Create a Paper.js Path to draw a line into it:

var myPath = new Path();
myPath.strokeColor = 'black';

// This function is called whenever the user
// clicks the mouse in the view:
var tool = new Tool();

//-------------------Variables--------------------------------------------------

var hex = [];
var armies = []

var sizeY = 25;
var size = 2 * sizeY/Math.sqrt(3);

var inLineXfinal = 10; // Liczba hexów w poziomie
var inLineYfinal = 5; // Liczba hexów w pionie

var inLineX = inLineXfinal * 2;
var inLineY = inLineYfinal - 1;

var viewX = size;
var viewY = size;

var inControl = false;
var somethingClicked = false;
//-------------------Map--------------------------------------------------------

for(var i = 0; i < inLineX * inLineY; i += inLineY)
{
    if(i % (2 * inLineY) == 0)
    {
        hex.push(new Hex(viewX + i/inLineY * sizeY, viewY, size, hex.length, "soil", []));
    }
    else
    {
        hex.push(new Hex(viewX + i/inLineY * sizeY, viewY + 1.5 * size, size, hex.length, "soil", []));
    }

    for(var j = 0; j < inLineY; j++)
    {
        hex.push(newHex(hex[hex.length - 1], 4));
    }
}

// Adding neighbours
for (var i = 0; i < hex.length; i++)
{
    hex[i].neighbour();
}

//Create map
function createMap(seasCount, maxSeaSize, citiesCount, players)
{
    //Seas
    for (var i = 0; i < seasCount; i++)
    {
        var rnd = Math.floor((Math.random() * hex.length));
        hex[rnd].sea(maxSeaSize);
    }

    //Cities
    for (var i = 0; i < citiesCount; i++)
    {
        var rnd = Math.floor((Math.random() * hex.length));

        if (hex[rnd].city())
        {
            i--;
        }
    }
}

// Creating a map
createMap(4, 12, 10, 2);

// Drawing a board
drawBoard();

//showNeighbours(229);

var border = new Path.RegularPolygon(new Point(0, 0), 6, hex[0].size);
border.strokeColor = 'yellow';
border.strokeWidth = 3;

//hex[50].incArmySize(14);
//hex[58].incArmySize(19);

var beginning = true;

var r = Math.floor(Math.random() * 255);
var g = Math.floor(Math.random() * 255);
var b = Math.floor(Math.random() * 255);

var you = new Player(4, yourName, "rgb(" + r + ", " + g + ", " + b + ")");

sendWelcome();

//var player1 = new Player(1, "marek", "purple");
//var player2 = new Player(2, "kuba", "pink");

//player1.take(hex[50]);
//player2.take(hex[58]);

canvas.width = hex[hex.length - 1].x + size;
canvas.height = hex[hex.length - 1].y + size;

var WIDTH = screen.width;
var HEIGHT = screen.height;

//Trzeba naprawić
/*
var path;
var startX = 0;
var startY = 0;
var diffX, diffY;


tool.onMouseDown = function(event) {
	startX = event.point.x;
	startY = event.point.y;
}

tool.onMouseDrag = function(event) {

	for(var i = 0; i < hex.length; i++) {
		var diffX = event.point.x - startX;
		var diffY = event.point.y - startY;

		hex[i].x += diffX;
		hex[i].path.position.x = hex[i].x;
		if(hex[i].mark != 0) hex[i].mark.position.x = hex[i].x;
		hex[i].armyText.position.x = hex[i].x;
		border.position.x = hex[0].x;

		hex[i].y += diffY;
		hex[i].path.position.y = hex[i].y;
		if(hex[i].mark != 0) hex[i].mark.position.y = hex[i].y;
		hex[i].armyText.position.y = hex[i].y;
		border.position.y = hex[0].y;
	}


	diffX = event.point.x - startX;
	diffY = event.point.y - startY;
	window.scrollBy(-diffX/2, -diffY/2);
	startX = event.point.x;
	startY = event.point.y;

}
*/

var beginnerTip = new PointText({
	point: [canvas.width/2, 150],
	content: "Choose your start point",
	fillColor: 'black',
	fontFamily: 'Courier New',
	fontWeight: 'bold',
	fontSize: 20,
	justification: 'center'
	});

var actualPlayer = new PointText({
	point: [canvas.width/2, 100],
	content: "Player's name",
	fillColor: 'black',
	fontFamily: 'Courier New',
	fontWeight: 'bold',
	fontSize: 40,
	justification: 'center'
	});


var currentTime = new PointText({
	point: [50, 100],
	content: "timer",
	fillColor: 'black',
	fontFamily: 'Courier New',
	fontWeight: 'bold',
	fontSize: 40,
	justification: 'center'
	});

var information = new PointText({
	point: [canvas.width/2, 50],
	content: "info",
	fillColor: 'black',
	fontFamily: 'Courier New',
	fontWeight: 'bold',
	fontSize: 20,
	justification: 'center'
	});


view.update();


receiveMsg();

//-------------------Client - Server-----------------------------------------

function Message(player, index, army, possesion) {
	this.player = player;
	this.index = index;
	this.army = army;
	this.possesion = possesion;
}


function Hexy(type, color, player, army) {
	this.type = type;
	this.color = color;
	this.player = player;
	this.army = army;
}

function sendWelcome() {

	var hexy = [];
	for(var i = 0; i < hex.length; i++) {
		hexy.push(JSON.stringify(new Hexy(hex[i].type, hex[i].color, JSON.stringify(hex[i].player), hex[i].army)));
	}

	var msg = [JSON.stringify(you), hexy];

	socket.emit('welcome', JSON.stringify(msg));
}

function sendMsg(hex) {
	var obj = new Message(JSON.stringify(you), hex.index, hex.army, JSON.stringify(hex.player));

	var msg = JSON.stringify(obj);

	socket.emit('message', msg);
}

function receiveMsg() {
	socket.on('message', function(obj){
		var msg = JSON.parse(obj);
		var possesion = JSON.parse(msg.possesion);
		var player = JSON.parse(msg.player);


		if(player.name != yourName) {
			hex[msg.index].army = msg.army;
			hex[msg.index].armyText.content = msg.army;
			if(possesion != 0) {
				hex[msg.index].player = new Player(possesion.id, possesion.name, possesion.color);
				hex[msg.index].path.fillColor = possesion.color;
				}
			if(hex[msg.index].army > 0) {
				hex[msg.index].armyText.insertAbove(hex[msg.index].path);
			} else {
				hex[msg.index].armyText.insertBelow(hex[msg.index].path);
				}
		}
		view.update();
	});

	socket.on('change', function(msg) {
		var player = JSON.parse(msg);
		actualPlayer.fillColor = player.color;
		if(player.name != yourName) {
			actualPlayer.content = player.name + "'s turn";
			inControl = false;
			for(var i = 0; i < hex.length; i++) {
				if(hex[i].mark != 0) hex[i].mark.remove();
				hex[i].pressed = false;
				hex[i].addArmy = false;
			}
			somethingClicked = false;
		} else {
			actualPlayer.content = "Your turn";
			inControl = true;
		}
		view.update();
	});

	socket.on('shareBoard', function(obj) {
		var p = JSON.parse(JSON.parse(obj)[0]);
		var board = JSON.parse(obj)[1];
		var b, n;
		if(p.name == yourName) {
			for(var i = 0; i < board.length; i++) {
				b = JSON.parse(board[i]);
				hex[i].type = b.type;
				hex[i].army = b.army;
				hex[i].armyText.content = b.army;
				n = JSON.parse(b.player);
				if(n != 0) {
					hex[i].player = new Player(5, n.name, n.color);
					hex[i].path.fillColor = n.color;
					if(hex[i].army > 0) hex[i].armyText.insertAbove(hex[i].path);
				} else {
					hex[i].path.fillColor = b.color;
					}
			}
		}
		view.update();
	});

	socket.on('time', function(time) {
		currentTime.content = time;
		view.update();
	});

	socket.on('info', function(msg) {
		var info = JSON.parse(msg);
		information.content = info[0] + " joined - players: " + info[1];
		setTimeout(function() {
				information.content = "";
				}, 3000);
		view.update();
	});
}


//-------------------Player---------------------------------------------------

function Player(id, name, color) {
	this.id = id;
	this.name = name;
	this.color = color;

	this.take = function(hex) {
		hex.player = this;
		hex.path.fillColor = this.color;
		//hex.incArmySize(1);
		//hex.armyFrom.decArmySize(1);
	}
}

//-------------------Hexagons---------------------------------------------------



function Hex(x, y, size, index, type, neighbours)
{
	this.x = x;
    	this.y = y;
	this.index = index;
	this.size = size;
	this.type = type;
	this.player = 0;
	this.army = 0;
    	this.neighbours = neighbours;
	this.path = 0;
	this.color = 0;
	this.pressed = false;
	this.armyText = 0;
	this.border = 0;
	this.addArmy = false;
	this.armyFrom = 0;
	this.mark = 0;



	this.fight = function(hexFrom, hexTo) {
		var taken = false;
		if(hexTo.army == 0) {
			taken = true;
		} else if(hexFrom.army > hexTo.army) {
			var rnd;
			if(hexFrom.army > 2 * hexTo.army) {
				rnd = Math.floor(Math.random() * 1);
			} else {
				rnd = Math.floor(Math.random() * 2);
			}
			if(rnd == 0) {
				taken = true;
				hexTo.army = 0;
			}
		} else {
			var rnd;
			if(hexTo.army == hexFrom.army) {
				rnd = Math.floor(Math.random() * 2);
			} else if(hexTo.army < 2 * hexFrom.army) {
				rnd = Math.floor(Math.random() * 5);
			} else {
				rnd = Math.floor(Math.random() * 10);
			}
			if(rnd == 0) {
				taken = true;
				hexTo.army = 0;
			}
		}

		hexFrom.decArmySize(1);
		if(taken) {
			hexFrom.player.take(hexTo);
			hexTo.incArmySize(1);
			if(hexTo.army > 0) {
				hexTo.path.insertBelow(hexTo.mark);
				hexTo.armyText.insertAbove(hexTo.mark);
				border.insertAbove(hexTo.armyText);
			}
		}
	}


	this.addEvents = function(data) {
		var self = this;
		data.onMouseEnter = function() {
			self.enterEvent();
		}

		data.onMouseLeave = function() {
			self.leaveEvent();
		}

		data.onClick = function() {
			self.clickEvent();
		}
	}


	this.incArmySize = function(x)
	{
		this.army += x;
		this.path.insertBelow(this.armyText);
		this.armyText.content = this.army;
	}

	this.decArmySize = function(x)
	{
		this.army -= x;
		if(this.army <= 0) this.armyText.insertBelow(this.path);
		this.armyText.content = this.army;
	}

	this.clickEvent = function() {
		var self = this;
		if(beginning && self.player == 0) {
			self.army = 30;
			self.armyText.content = 30;
			self.armyText.insertAbove(self.path);
			you.take(self);
			//sendWelcome();
			sendMsg(self);
			beginning = false;
			beginnerTip.remove();
		}
		if(inControl) {
			if(self.pressed == true) {
					self.pressed = false;
					self.mark.remove();

					for(var i = 0; i < self.neighbours.length; i++) {
						//self.neighbours[i].path.fillColor = self.neighbours[i].color;
						self.neighbours[i].mark.remove();
						self.neighbours[i].addArmy = false;
						somethingClicked = false;
					}
				} else {
					//

					if(self.addArmy) {
						if(self.armyFrom.army > 0 && self.army >= 0 && self.armyFrom.player != 0) {
							if(self.player == 0 || self.player == self.armyFrom.player) {
								self.incArmySize(1);
								self.armyFrom.decArmySize(1);
								if(self.army > 0) {
									self.path.insertBelow(self.mark);
									self.armyText.insertAbove(self.mark);
									border.insertAbove(self.armyText);
								}
								self.armyFrom.player.take(self);
							} else {
								self.fight(self.armyFrom, self);
							}
						}
					} else if(!somethingClicked && self.player != 0 && self.player.name == you.name){
						self.pressed = true;
						somethingClicked = true;
						self.color = self.path.fillColor;
						//self.path.fillColor = "#FFFF33";
						self.mark = new Path.RegularPolygon(new Point(self.x, self.y), 6, self.size);
						self.mark.fillColor = "yellow";
						self.mark.opacity = 0.5;
						self.addEvents(self.mark);
						if(self.army > 0) self.armyText.insertAbove(self.mark);

						for(var i = 0; i < self.neighbours.length; i++) {
							self.neighbours[i].color = self.neighbours[i].path.fillColor;
							//self.neighbours[i].path.fillColor = "#FFFF33";
							self.neighbours[i].mark = new Path.RegularPolygon(new Point(self.neighbours[i].x, self.neighbours[i].y), 6, self.neighbours[i].size);
							self.neighbours[i].mark.fillColor = "yellow";
							self.neighbours[i].mark.opacity = 0.5;
							self.neighbours[i].addEvents(self.neighbours[i].mark);
							if(self.neighbours[i].army > 0) self.neighbours[i].armyText.insertAbove(self.neighbours[i].mark);
							self.neighbours[i].addArmy = true;
							self.neighbours[i].armyFrom = self;
						}
					}
				}
				sendMsg(self);
				if(self.armyFrom != 0) sendMsg(self.armyFrom);
			}
	}

	this.enterEvent = function() {
		var self = this;
		//border.position = [self.x, self.y];


		//self.border = new Path.RegularPolygon(new Point(self.x, self.y), 6, self.size);
		//self.path.strokeColor = 'yellow';
		//self.path.strokeWidth = 3;
	}

	this.leaveEvent = function() {
		//var self = this;
		//self.border.remove();
	}


    this.draw = function() {
		var self = this;

		this.path = new Path.RegularPolygon(new Point(this.x, this.y), 6, this.size);

		this.path.strokeWidth = 1;
		this.path.strokeColor = 'black';

		this.addEvents(this.path);


		switch(this.type)
        {
            case "water":
				this.path.fillColor = '#0080FF';
				this.color = '#0080FF';
                break;
            case "soil":
				this.path.fillColor = '#468B01';
				this.color = '#468B01';
                break;
            case "city":
				this.path.fillColor = 'red';
				this.color = 'red';

				//armies.push(this);

				//var circle = new Path.Circle(new Point(this.x, this.y), this.army);
				//circle.fillColor = '#FF0000';

				/*
				circle.style = {
				    strokeColor: 'black',
				    dashArray: [4, 10],
				    strokeWidth: 4,
				    strokeCap: 'round'
				};
				*/
                break;
        }


		this.armyText = new PointText({
			point: [this.x, this.y],
			content: this.army,
			fillColor: 'black',
			fontFamily: 'Courier New',
			fontWeight: 'bold',
			fontSize: 20,
			justification: 'center'
		});

		this.armyText.insertBelow(this.path);

		this.addEvents(this.armyText);

    }

    this.sea = function(x)
    {
        if (x>0)
        {
            this.type = "water";
            var rnd = Math.floor((Math.random() * this.neighbours.length));

            for (var i = 0; i < rnd; i++)
            {
                x--;
                var k = Math.floor((Math.random() * rnd));
                hex[this.neighbours[k].index].sea(x);
            }
        }
    }

    this.city = function()
    {
        if (this.type != "water")
        {
            this.type = "city";

            return 0;
        }

      return 1;
    }

    this.neighbour = function()
    {
        var neighbours_numbers;

        if(temp(this.index) % 2 == 0)
        {
			neighbours_numbers = [inLineYfinal - 1, 2 * inLineYfinal, inLineYfinal, -inLineYfinal, -2 * inLineYfinal, -inLineYfinal - 1];
        }
        else
        {
            neighbours_numbers = [inLineYfinal, 2 * inLineYfinal, inLineYfinal + 1, -inLineYfinal + 1, -2 * inLineYfinal, -inLineYfinal];
        }

        for (var i = 0; i < neighbours_numbers.length; i++)
        {
            if ((this.index + neighbours_numbers[i]) > 0  && (this.index + neighbours_numbers[i]) < (hex.length - 1))
            {
                neighbours.push(hex[this.index + neighbours_numbers[i]]);
            }
        }
    }
}


function drawBoard()
{
    for(var i = 0; i < hex.length; i++)
    {
        hex[i].draw();
    }
	view.draw();
}

function newHex(hexagon, n)
{
    //var a = [0, 1.5, 1.5, 0, -1.5, -1.5];
    //var b = [-2, -1, 1, 2, 1, -1];

    //return (new Hex(hexagon.x + a[n-1] * size, hexagon.y + b[n-1] * sizeY, size, hex.length, "soil", 0, 10, [], 0, 0));

	n = 4;
	a = 0;
	b = 2;
	return (new Hex(hexagon.x + a * sizeY, hexagon.y + b * 1.5 * size, size, hex.length, "soil", []));
}

function showNeighbours(n)
{
    var result = [];

    for(var i = 0; i < hex[n].neighbours.length; i++)
    {
        result.push(hex[n].neighbours[i].index);
    }

	var text = new PointText({
				    point: [50,900],
				    content: result,
				    fillColor: 'black',
				    fontFamily: 'Courier New',
				    fontWeight: 'bold',
				    fontSize: 15
				});
}

function temp(n)
{
    for(var i = 0; i < 2 * inLineXfinal; i++)
    {
        if (n >= i * inLineYfinal && n < i * inLineYfinal + inLineYfinal)
        {
            return i;
        }
    }
    return 0;
}

}