var socket = io();

paper.install(window);

var yourName = prompt("Your name");
window.onload = function() {


var canvas = document.getElementById('myCanvas');
paper.setup(canvas);

var tool = new Tool();

//-------------------Variables--------------------------------------------------

var hex = [];

var sizeY = 25;
var size = 2 * sizeY/Math.sqrt(3);

var inLineXfinal = 35; // Liczba hexów w poziomie
var inLineYfinal = 10; // Liczba hexów w pionie

var inLineX = inLineXfinal * 2;
var inLineY = inLineYfinal - 1;

var viewX = size;
var viewY = size; 

var inControl = true;

//-------------------Map--------------------------------------------------------

for(var i = 0; i < inLineX * inLineY; i += inLineY)
{
    if(i % (2 * inLineY) == 0)
    {
        hex.push(new Hex(viewX + i/inLineY * sizeY, viewY, size, hex.length, "soil", [], []));
    }
    else
    {
        hex.push(new Hex(viewX + i/inLineY * sizeY, viewY + 1.5 * size, size, hex.length, "soil", [], []));
    }

    for(var j = 0; j < inLineY; j++)
    {
		hex.push(new Hex(hex[hex.length - 1].x, hex[hex.length - 1].y + 3 * size, size, hex.length, "soil", [], []));
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

//Indicator
var border = new Path.RegularPolygon(new Point(0, 0), 6, hex[0].size);
border.strokeColor = 'yellow';
border.strokeWidth = 3;

var beginning = true;

var r = Math.floor(Math.random() * 255);
var g = Math.floor(Math.random() * 255);
var b = Math.floor(Math.random() * 255);

var you = new Player(4, yourName, "rgb("+ r +", "+ g +", "+ b +")");

sendWelcome();


//Example players
hex[50].incArmySize(14);
hex[58].incArmySize(19);

var player1 = new Player(1, "marek", "purple");
var player2 = new Player(2, "kuba", "pink");

player1.take(hex[50]);
player2.take(hex[58]);


//Dimensions
canvas.width = hex[hex.length - 1].x + size;
canvas.height = hex[hex.length - 1].y + size;

var WIDTH = screen.width;
var HEIGHT = screen.height;


//Credits
var beginnerTip = new PointText({
	point: [canvas.width/2, 150],
	content: "Choose your start point",
	fontSize: 20,
	});

var actualPlayer = new PointText({
	point: [canvas.width/2, 100],
	content: "Player's name",
	fontSize: 40,
	});
	
	
var currentTime = new PointText({
	point: [50, 100],
	content: "timer",
	fontSize: 40,
	});
	
var information = new PointText({
	point: [canvas.width/2, 50],
	content: "info",
	fontSize: 20,
	});
	
var credits = new Group([beginnerTip, actualPlayer, currentTime, information]);
credits.fillColor = 'black';
credits.fontFamily ='Courier New';
credits.fontWeight = 'bold';
credits.justification ='center';


//Initial update
view.update();


//Start receiving messges from server
receiveMsg();

//-------------------Client - Server-----------------------------------------

function Message(player, index, army, possesion) {
	this.player = player;
	this.index = index;
	this.armyText.content = army;
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
		hexy.push(JSON.stringify(new Hexy(hex[i].type, hex[i].color, JSON.stringify(hex[i].player), hex[i].armyText.content)));
	}
	var msg = [JSON.stringify(you), hexy];
	socket.emit('welcome', JSON.stringify(msg));
}

function sendMsg(hex) {
	var obj = new Message(JSON.stringify(you), hex.index, hex.armyText.content, JSON.stringify(hex.player));
	var msg = JSON.stringify(obj);
	socket.emit('message', msg);
}

function receiveMsg() {
	socket.on('message', function(obj){
		var msg = JSON.parse(obj);
		var possesion = JSON.parse(msg.possesion);
		var player = JSON.parse(msg.player);
		
		if(player.name != yourName) {
			hex[msg.index].armyText.content = msg.army;
			hex[msg.index].armyText.content = msg.army;
			if(possesion != 0) {
				hex[msg.index].player = new Player(possesion.id, possesion.name, possesion.color);
				hex[msg.index].path.fillColor = possesion.color;
				}
			if(hex[msg.index].armyText.content > 0) {
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
				hex[i].press = "light up";
				for(var i = 0; i < hex[i].neighbours.length; i++) {
					if(hex[i].neighbours[i].player.name == you.name) {
							hex[i].neighbours[i].press = "light up";
						} else {
							hex[i].neighbours[i].press = "none";
						}
				}
			}
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
				hex[i].armyText.content = b.army;
				hex[i].armyText.content = b.army;
				n = JSON.parse(b.player);
				if(n != 0) {
					hex[i].player = new Player(5, n.name, n.color);
					hex[i].path.fillColor = n.color;
					if(hex[i].armyText.content > 0) hex[i].armyText.insertAbove(hex[i].path);
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
		//hex.path.strokeColor = this.color;
		//hex.path.strokeScaling = false;
		//hex.path.strokeWidth = 3;
		hex.viewOrder();
	}
}

//-------------------Hexagons---------------------------------------------------

function Hex(x, y, size, index, type, neighbours, borders)
{
	this.x = x;
    this.y = y;
	this.index = index;
	this.size = size;
	this.type = type;
	this.player = 0;
    this.neighbours = neighbours;
	this.color = 0;
	this.armyFrom = 0;
	this.press = "starting point";
	this.activated = false;
	
	this.path = 0;
	this.armyText = 0;
	this.borders = 0;
	
	this.drawBorders = function() {
		if(this.player != 0) this.drawBorder();
		for(var i = 0; i < this.neighbours.length; i++) {
			if(this.neighbours[i].player != 0) this.neighbours[i].drawBorder();
			for(var j = 0; j < this.neighbours[i].neighbours.length; j++) {
				if(this.neighbours[i].neighbours[j].player != 0) this.neighbours[i].neighbours[j].drawBorder();
			}
		}
	}

	this.drawBorder = function() {
		if(this.borders != 0) this.borders.remove();
		this.borders = new Group();
		var point1 = new Point(this.x, this.y - sizeY - 2);
		var point2 = new Point(this.x, this.y - sizeY - 2);
		
		for(var i = 0; i < this.neighbours.length; i++) {
			if(this.neighbours[i].player != this.player) {
				//alert("done!");
				var tempPoint1 = point1.rotate(60 * i, new Point(this.x, this.y));
				var tempPoint2 = point2.rotate(60 * (i + 1), new Point(this.x, this.y));
				var border = new Path(tempPoint1, tempPoint2);
				border.strokeColor = this.player.color;
				border.strokeWidth = 5;
				border.strokeCap = 'round';
				this.borders.addChild(border);
			}
		}
	}
	
	
	this.viewOrder = function() {
		this.path.bringToFront();
		if(this.armyText.content > 0) this.armyText.bringToFront();
		if(this.borders != 0) this.borders.bringToFront();
		this.drawBorders();
	}
	
	this.fight = function(hexFrom, hexTo) {
		var taken = false;
		if(hexTo.armyText.content == 0) {
			taken = true;
		} else if(hexFrom.armyText.content > hexTo.army) {
			var rnd;
			if(hexFrom.armyText.content > 2 * hexTo.army) {
				rnd = Math.floor(Math.random() * 1);
			} else {
				rnd = Math.floor(Math.random() * 2);
			}
			if(rnd == 0) {
				taken = true;
			}
		} else {
			var rnd;
			if(hexTo.armyText.content == hexFrom.army) {
				rnd = Math.floor(Math.random() * 2);
			} else if(hexTo.armyText.content < 2 * hexFrom.army) {
				rnd = Math.floor(Math.random() * 5);
			} else {
				rnd = Math.floor(Math.random() * 10);
			}
			if(rnd == 0) {
				taken = true;
			}
		}
		
		hexFrom.decArmySize(1);
		if(taken) {
			hexFrom.player.take(hexTo);
			hexTo.armyText.content = 0;
			hexTo.incArmySize(1);
		}
	}
	

	this.addEvents = function(data) {
		var self = this;
		data.onMouseEnter = function() {
			self.enterEvent();
			self.path.selectedColor = 'yellow';
			self.path.selected = true;
			
		}

		data.onMouseLeave = function() {
			self.leaveEvent();
			if(!self.activated) self.path.selected = false;
		}
		
		data.onClick = function() {
			self.clickEvent();
		}
	}
	
	this.incArmySize = function(x)
	{
		var tempNumber = parseInt(this.armyText.content);
		tempNumber += x;
		this.armyText.content = tempNumber;
		//this.path.insertBelow(this.armyText);
		this.viewOrder();
	}
	
	this.decArmySize = function(x)
	{
		this.armyText.content -= x;
		if(this.armyText.content <= 0) this.armyText.insertBelow(this.path);
	}
	
	this.lightUp = function() {
		var self = this;
		self.color = self.path.fillColor;
		
	}
	
	this.clickEvent = function() {
		var self = this;
		
		switch(self.press)
        {
            case "light up":
				if(inControl) {
				    switchOffAll();
					self.path.selected = true;
					self.activated = true;
					self.press = "switch off";
					for(var i = 0; i < self.neighbours.length; i++) {
						self.neighbours[i].path.selected = true;
						self.neighbours[i].activated = true;
						self.neighbours[i].press = "add army";
						self.neighbours[i].armyFrom = self;
					}
				}
                break;
			case "switch off":
				self.path.selected = false;
				self.activated = false;
				self.press = "light up";
				for(var i = 0; i < self.neighbours.length; i++) {
					self.neighbours[i].path.selected = false;
					self.neighbours[i].activated = false;
					self.neighbours[i].press = "light up";
				}
				break;
			case "add army":
				if(self.armyFrom.armyText.content > 0) {
					if(self.player == 0 || self.player == self.armyFrom.player) {
						self.incArmySize(1);
						self.armyFrom.decArmySize(1);
						self.armyFrom.player.take(self);
					} else {
						self.fight(self.armyFrom, self);
					}
				}
				break;
			case "starting point":
				switchOffAll();
				self.armyText.content = 30;
				you.take(self);
				sendMsg(self);
				beginning = false;
				beginnerTip.remove();
				break;
		}
	}
	
	this.enterEvent = function() {
		var self = this;
		//border.position = [self.x, self.y];
	}
	
	this.leaveEvent = function() {

	}
	
    this.draw = function() {
		var self = this;
		this.path = new Path.RegularPolygon(new Point(this.x, this.y), 6, this.size);
		this.path.strokeWidth = 1;
		this.path.strokeColor = 'black';
		this.addEvents(this.path);
		this.path.selectedColor = 'yellow';

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
                break;
        }
		
		this.armyText = new PointText({
			point: [this.x, this.y],
			content: 0,
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

function switchOffAll() {
	for(var i = 0; i < hex.length; i++) {
		hex[i].press = "light up";
		hex[i].activated = false;
		hex[i].path.selected = false;
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
