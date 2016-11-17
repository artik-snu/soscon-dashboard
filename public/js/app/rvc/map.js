function real2canvas(x, y) {
    newX = Math.round(x/45)+10;
    newY = Math.round(y/45)+10;

    if(newX < 0) newX = 0;
    if(newY < 0) newY = 0;
    if(newX > 44) newX = 44;
    if(newY > 44) newY = 44;

    return {
        x: newX,
        y: newY
    };
}

function canvas2real(x, y) {
    return {
        x: (x - 10) * 45,
        y: (y - 10) * 45
    }
}

function num2color(x) {
    //var h = (1.0 - x) * 240;
    //return "hsl(" + h + ", 100%, 45%)";
    if(x > 0.8) x = 0.8;
    var l = 255 - Math.floor(x * 255);
    return 'rgb(' + l + ',' + l + ',' + l +')';
}

function toDegrees(rad) {
    return rad / Math.PI * 180;
}


window.PowerbotMap = {init: false, mvalue: []};
PowerbotMap.run = function(ix, iy, imap_value) {
    if(PowerbotMap.init) return;
    PowerbotMap.init = true;

    var engine = new (function () {

        var canvas = this.__canvas = new fabric.Canvas('map_fabric', {renderOnAddRemove: false
        });

        var map = [];
        var map_value = [];
        var max = 0;
        var robot, home;

        for(var i = 0; i < 45; i++) {
            map_value.push([]);
            for(var j = 0; j < 45; j++) {
                map_value[i].push(imap_value[i][j]);
            }
        }

        var self = this;

        var robot_size = {width: 75, height: 75};
        var home_pos = real2canvas(0, 0);
        fabric.Image.fromURL('/img/powerbot.png', function(img) {
            robot = img;
            canvas.add(img.set({
                left: home_pos.x * pixel_size,
                top: home_pos.y * pixel_size,
                originX: 'center',
                originY: 'center'
            }).scale(0.5));
        });

        home = new fabric.Circle({
            left: home_pos.x * pixel_size,
            top: home_pos.y * pixel_size,
            width: 45,
            height: 45,
            originX: 'center',
            originY: 'center',
            fill: '#f00'
        });
        canvas.add(home);

        this.register_pos = function (x, y, render) {
            if (Math.abs(x) < 0.1 && Math.abs(y) < 0.1) return;
            if (render === undefined) render = true;
            var pos = real2canvas(x, y);
            var updated = false;
            for (var i = pos.x - 2; i <= pos.x + 2; i++) {
                for (var j = pos.y - 2; j <= pos.y + 2; j++) {
                    if (map_value[i] !== undefined && map_value[i][j] !== undefined) {
                        map_value[i][j]++;

                        if (max < map_value[i][j]) {
                            max = map_value[i][j];
                            updated = true;
                        }
                        map[i][j].setFill(num2color(map_value[i][j]/30));
                    }
                }
            }
            if (updated) self.update_map(render);
            else if (render) canvas.renderAll();
        };

        this.update_map = function(render) {
            if (render === undefined) render = true;
            for (var i = 0; i < 45; i++) {
                for (var j = 0; j < 45; j++) {
                    map[i][j].setFill(num2color(map_value[i][j]/30));
                }
            }
            if (render) canvas.renderAll();
        }

        this.update_robot = function(pos) {
            var canvas_pos = real2canvas(-pos.y, -pos.x);
            //if(canvas_pos.x < 0) canvas_pos.x = 0;
            //if(canvas_pos.y < 0) canvas_pos.y = 0;
            //if(canvas_pos.x > 512) canvas_pos.x = 512;
            //if(canvas_pos.y > 512) canvas_pos.y = 512;
            //console.log("pos", canvas_pos, pos);
            robot.set({
                left: canvas_pos.x * pixel_size,
                top: canvas_pos.y * pixel_size,
                angle: toDegrees(-pos.q)
            });
            canvas.renderAll();
        }

        var pixel_size = 10;
        for (var i = 0; i < 45; i++) {
            map.push([]);
            if(map_value.length < 45)
                map_value.push([]);
            for (var j = 0; j < 45; j++) {
                if(map_value[i].length < 45)
                    map_value[i].push(0);
                map[i].push(new fabric.Rect({
                    left: i * pixel_size,
                    top: j * pixel_size,
                    originX: 'left',
                    originY: 'top',
                    width: pixel_size,
                    height: pixel_size,
                    fill: '#eee',
                    evented: false,
                    selectable: false

                }));
                canvas.add(map[i][j]);
            }
        }

        for(var i = 0; i < 45; i++) {
            for(var j = 0; j < 45; j++) {
                if (max < map_value[i][j]) {
                    max = map_value[i][j];
                }
            }
        }
        for(var i = 0; i < 45; i++) {
            for(var j = 0; j < 45; j++) {
                map[i][j].setFill(num2color(map_value[i][j]/30));
            }
        }

        canvas.renderAll();

        setTimeout(function() {
            engine.update_robot({x: ix, y: iy});
        }, 1000);

        var socket = io('http://192.168.0.3:3000');
        socket.on('log', function(data) {
            var pos = data.pose;
            engine.register_pos(-pos.y, -pos.x);
            engine.update_robot(pos);
            //home.bringToFront();
            robot.bringToFront();
            canvas.renderAll();
            PowerbotMap.mvalue = map_value;
        });

    })();
}
