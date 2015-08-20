
var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");
var hex = [];
var sizeY = 25;
var size = 2 * sizeY/Math.sqrt(3);
var inLineXfinal = 20; // Liczba hexów w poziomie
var inLineYfinal = 16; // Liczba hexów w pionie
// Wszystko jest zautomatyzowanie

ctx.canvas.width  = window.innerWidth;
ctx.canvas.height = window.innerHeight;

// Creating new board
/*
for (var k = 0; k < inLineY; k++)
{
  hex.push(new Hex(size*3, sizeY*2+sizeY*2*k, size, hex.length, "soil",0,0,[]));

  for (var i = 0; i < inLineX - 1; i++)
  {
    for (var j = 0; j < 2 ; j++)
    {
      if (j==0)
      {
        hex.push(newHex(hex[hex.length - 1], 3));
      }
      else
      {
        hex.push(newHex(hex[hex.length - 1], 2));
      }
    }
  }
}
*/

var inLineX = inLineXfinal * 2;
var inLineY = inLineYfinal - 1;
for(var i = 0; i < inLineX * inLineY; i += inLineY) {
if(i % (2 * inLineY) == 0) {
hex.push(new Hex(100 + i/inLineY * size * 1.5, 100, size, hex.length, "soil", 0, 0, []));
} else {
//alert(i);
hex.push(new Hex(100 + i/inLineY * size * 1.5, 100 + sizeY, size, hex.length, "soil", 0, 0, []));
}
for(var j = 0; j < inLineY; j++) {
hex.push(newHex(hex[hex.length - 1], 4));
}
}


// Adding neighbours
for (var i = 0; i < hex.length; i++)
{
  hex[i].neighbour();
}


showNeighbours(155);

//alert(temp(287));


//Creating sea
hex[155].sea(6);


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

createMap(4, 12, 10, 2);

//hex[10].city()

// Drawing a board
drawBoard();

//-------------------------------------------------------------------------

function Hex(x,y,size,index,type,player,army, neighbours) {
    this.x = x;
    this.y = y;
    this.index = index;
    this.size = size;
    this.type = type;
    this.player = player
    this.army = army;
    this.neighbours = neighbours;

    this.draw = function()
    {
      switch(this.type)
      {
        case "water":
            ctx.fillStyle = "blue";
            break;
        case "soil":
            ctx.fillStyle = "brown";
            break;
        case "city":
            ctx.fillStyle = "grey";
            break;
      }

        var a = this.x + this.size;
        var b = this.y;
        var result = this.rotate(a, b, -60 * Math.PI/180);
        var c = result[0];
        var d = result[1];

        ctx.beginPath();
        ctx.moveTo(a, b);
        ctx.lineTo(c, d);

for(var i = -120; i >= -360; i -= 60) {
result = this.rotate(a, b, i * Math.PI/180);
c = result[0];
d = result[1];
ctx.lineTo(c, d);
}

        ctx.fill();
        ctx.stroke();
        ctx.lineWidth = 3;

        //ctx.fillStyle = "white";
        //ctx.font="10px Verdana";
        //ctx.fillText(index, this.x, this.y);
    }

    this.rotate = function(x, y, angle) {
        var result = [x,y];

        result[0] = (x - this.x) * Math.cos(angle) - (y - this.y) * Math.sin(angle) + this.x;
        result[1] = (x - this.x) * Math.sin(angle) - (y - this.y) * Math.cos(angle) + this.y;

        return result;
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
          //alert(this.neighbours[k].index);
          hex[this.neighbours[k].index].sea(x);
        }
      }


    }

    this.city = function()
    {
      if (this.type != "water")
      {

        this.type = "city";

        ctx.fillStyle = "white";
        ctx.font="10px Verdana";
        ctx.fillText("kraków", 50, 950);

        return 0;
      }

      return 1;

    }

    this.neighbour = function()
    {
var neighbours_numbers;
if(temp(this.index) % 2 == 0) {
neighbours_numbers = [-1, inLineYfinal - 1, inLineYfinal, 1, -inLineYfinal, -inLineYfinal - 1];
} else {
neighbours_numbers = [-1, inLineYfinal, inLineYfinal + 1, 1, -inLineYfinal + 1, -inLineYfinal];
}

for (var i = 0; i < neighbours_numbers.length; i++) {
if ((this.index + neighbours_numbers[i]) > 0  && (this.index + neighbours_numbers[i]) < (hex.length - 1))
{
  neighbours.push(hex[this.index + neighbours_numbers[i]]);
}
}
    }
}


function drawBoard() {
    for(var i = 0; i < hex.length; i++) {
        hex[i].draw();
    }
}

function newHex(hexagon, n) {
var a = [0, 1.5, 1.5, 0, -1.5, -1.5];
var b = [-2, -1, 1, 2, 1, -1];

return (new Hex(hexagon.x + a[n-1] * size, hexagon.y + b[n-1] * sizeY, size, hex.length, "soil", 0, 0, []));
}

function showNeighbours(n) {
var result = [];
for(var i = 0; i < hex[n].neighbours.length; i++) {
result.push(hex[n].neighbours[i].index);
}
//alert(result);
//ctx.font="20px Verdana";
//ctx.fillText("Hex o indexie " + n + " ma sąsiadów o indexach: " + result, 50, 950);
}

function temp(n) {
for(var i = 0; i < 2 * inLineXfinal; i++) {
if (n >= i * inLineYfinal && n < i * inLineYfinal + inLineYfinal) {
return i;
}
}
return 0;
}