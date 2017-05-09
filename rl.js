var Game = {
    display: null,
    map: {},
    engine: null,
    player: null,
    pedro: null,
    ananas: null,
    
    init: function() {
        this.display = new ROT.Display({spacing:1.1});
        document.body.appendChild(this.display.getContainer());
        
        this._generateMap();
        
        var scheduler = new ROT.Scheduler.Simple();
        scheduler.add(this.player, true);
        scheduler.add(this.pedro, true);

        this.engine = new ROT.Engine(scheduler);
        this.engine.start();
    },
    
    _generateMap: function() {
        var digger = new ROT.Map.Digger();
        var freeCells = [];
        
        var digCallback = function(x, y, value) {
            if (value) { return; }
            
            var key = x+","+y;
            this.map[key] = ".";
            freeCells.push(key);
        }
        digger.create(digCallback.bind(this));
        
        this._generateBoxes(freeCells);
        this._drawWholeMap();
        
        this.player = this._createBeing(Player, freeCells);
        this.pedro = this._createBeing(Pedro, freeCells);
    },
    
    _createBeing: function(what, freeCells) {
        var index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
        var key = freeCells.splice(index, 1)[0];
        var parts = key.split(",");
        var x = parseInt(parts[0]);
        var y = parseInt(parts[1]);
        return new what(x, y);
    },
    
    _generateBoxes: function(freeCells) {
        for (var i=0;i<10;i++) {
            var index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
            var key = freeCells.splice(index, 1)[0];
            this.map[key] = "%c{#ccf}*";
            if (!i) { this.ananas = key; } /* first box contains an ananas */
        }
    },
    
    _drawWholeMap: function() {
        for (var key in this.map) {
            var parts = key.split(",");
            var x = parseInt(parts[0]);
            var y = parseInt(parts[1]);
            this.display.draw(x, y, this.map[key]);
        }
    }
};

var Glyph = function(x, y, bg, fg, chr) {
    this._x = x;
    this._y = y;
    this._bg = typeof bg !== undefined ? bg : "#000";
    this._fg = typeof bg !== undefined ? bg : "#ccc";
    this._chr = chr;
}

Glyph.prototype.draw = function() { Game.display.draw(this._x, this._y, this._chr, this._fg, this._bg)}

var Player = function(x, y) {
    this._x = x;
    this._y = y;
    this._draw();
}
    
Player.prototype.getSpeed = function() { return 100; }
Player.prototype.getX = function() { return this._x; }
Player.prototype.getY = function() { return this._y; }

Player.prototype.act = function() {
    Game.engine.lock();
    window.addEventListener("keydown", this);
}
    
Player.prototype.handleEvent = function(e) {
    var code = e.keyCode;
    if (code == ROT.VK_SPACE || code == ROT.VK_SPACE) {
        this._checkBox();
        return;
    }

    keyMap = {};
    keyMap[ROT.VK_K] = 0;
    keyMap[ROT.VK_UP] = 0;
    keyMap[ROT.VK_NUMPAD8] = 0;
    keyMap[ROT.VK_U] = 1;
    keyMap[ROT.VK_NUMPAD9] = 1;
    keyMap[ROT.VK_L] = 2;
    keyMap[ROT.VK_RIGHT] = 2;
    keyMap[ROT.VK_NUMPAD6] = 2;
    keyMap[ROT.VK_N] = 3;
    keyMap[ROT.VK_NUMPAD3] = 3;
    keyMap[ROT.VK_J] = 4;
    keyMap[ROT.VK_DOWN] = 4;
    keyMap[ROT.VK_NUMPAD2] = 4;
    keyMap[ROT.VK_B] = 5;
    keyMap[ROT.VK_NUMPAD1] = 5;
    keyMap[ROT.VK_H] = 6;
    keyMap[ROT.VK_LEFT] = 6;
    keyMap[ROT.VK_NUMPAD4] = 6;
    keyMap[ROT.VK_Y] = 7;
    keyMap[ROT.VK_NUMPAD7] = 7;

    keyMap[ROT.VK_PERIOD] = -1;
    keyMap[ROT.VK_CLEAR] = -1;
    keyMap[ROT.VK_NUMPAD5] = -1;

    /* one of numpad directions? */
    if (!(code in keyMap)) { return; }

    /* is there a free space? */
    if (keyMap[code] !== -1) {
        var dir = ROT.DIRS[8][keyMap[code]];
        var newX = this._x + dir[0];
        var newY = this._y + dir[1];
        var newKey = newX + "," + newY;
        if (!(newKey in Game.map)) { return; }
    } else {
        var newX = this._x;
        var newY = this._y;
        var newKey = newX + "," + newY;
    }

    Game.display.draw(this._x, this._y, Game.map[this._x+","+this._y]);
    this._x = newX;
    this._y = newY;
    this._draw();
    window.removeEventListener("keydown", this);
    Game.engine.unlock();
}

Player.prototype._draw = function() {
    Game.display.draw(this._x, this._y, "@", "#ff0");
}
    
Player.prototype._checkBox = function() {
    var key = this._x + "," + this._y;
    if (Game.map[key] == "%c{yellow}*") {
        alert("This box has been already opened. It's empty. :-(")
    } else if (Game.map[key] != "%c{blue}*") {
        alert("There is no box here!");
    } else if (key == Game.ananas) {
        alert("Hooray! You found an ananas and won this game.");
        Game.engine.lock();
        window.removeEventListener("keydown", this);
    } else {
        alert("This box is empty :-(");
        Game.map[key] = "%c{yellow}*";
    }
}
    
var Pedro = function(x, y) {
    this._x = x;
    this._y = y;
    this._draw();
}
    
Pedro.prototype.getSpeed = function() { return 100; }
    
Pedro.prototype.act = function() {
    var x = Game.player.getX();
    var y = Game.player.getY();

    var passableCallback = function(x, y) {
        return (x+","+y in Game.map);
    }
    var astar = new ROT.Path.AStar(x, y, passableCallback, {topology:4});

    var path = [];
    var pathCallback = function(x, y) {
        path.push([x, y]);
    }
    astar.compute(this._x, this._y, pathCallback);

    path.shift();
    if (path.length == 1) {
        Game.engine.lock();
        alert("Game over - you were captured by Pedro!");
    } else {
        x = path[0][0];
        y = path[0][1];
        Game.display.draw(this._x, this._y, Game.map[this._x+","+this._y]);
        this._x = x;
        this._y = y;
        this._draw();
    }
}
    
Pedro.prototype._draw = function() {
    Game.display.draw(this._x, this._y, "P", "red");
}    

window.onload = function() {
    // Check if rot.js can work on this browser
    if (!ROT.isSupported()) {
        alert("The rot.js library isn't supported by your browser.");
        throw new Error("rot.js isn't supported by this browser.")
    }
    Game.init();
}