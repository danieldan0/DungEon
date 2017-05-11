var SCREEN_WIDTH = 80;
var SCREEN_HEIGHT = 25;
var MAP_WIDTH = 80;
var MAP_HEIGHT = 20;

var color_dark_wall = "#f8f";
var color_dark_floor = "#848";

var Game = {
    init: function() {
        ROT.DEFAULT_WIDTH = SCREEN_WIDTH;
        ROT.DEFAULT_HEIGHT = SCREEN_HEIGHT;
        Display.display = new ROT.Display({spacing:1.1});
        document.body.appendChild(Display.display.getContainer());

        Map.generateMap(MAP_WIDTH, MAP_HEIGHT);
        Display.drawMap();
    }
};

var Display = {
    display: null,

    drawMap: function() {
        for (var y = 0; y < MAP_HEIGHT; y++) {
            for (var x = 0; x < MAP_WIDTH; x++) {
                wall = Map.map[y][x].blocks_sight;
                if (wall) {
                    this.display.draw(x, y, ' ', null, color_dark_wall);
                } else {
                    this.display.draw(x, y, ' ', null, color_dark_floor);
                }
            }
        }
    }
};

var Map = {
    map: [],

    generateMap: function(w, h) {
        var row = [];
        for (var y = 0; y < MAP_HEIGHT; y++) {
            for (var x = 0; x < MAP_WIDTH; x++) {
                row.push(new Tile(false));
            }
            this.map.push(row);
            row = [];
        }

        var digger = new ROT.Map.Digger(w, h);

        var digCallback = function(x, y, value) {
            this.map[y][x] = new Tile(value, value);
        }
        digger.create(digCallback.bind(this));
    }
};

var Obj = function(x, y, chr, color) {
    this._x = x;
    this._y = y;
    this._chr = chr;
    this._color = color;
};

Obj.prototype.move = function(dx, dy) { this._x += dx; this._y += dy; };
Obj.prototype.draw = function() { Display.display.draw(this._x, this._y, this._chr, this._color); };
Obj.prototype.clear = function() { Display.display.draw(this._x, this._y, ' '); };

var Tile = function(blocked, blocks_sight) {
    this._blocked = blocked;
    this._blocks_sight = typeof blocks_sight ? blocks_sight : blocked;
}

window.onload = function() {
    // Check if rot.js can work on this browser
    if (!ROT.isSupported()) {
        alert("The rot.js library isn't supported by your browser.");
        throw new Error("rot.js isn't supported by this browser.")
    }
    Game.init();
}
