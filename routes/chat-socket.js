var powerbot = require('./powerbot');

function connect(http) {
	var io = require('socket.io')(http);

	var numUsers = 0;
	io.on('connection', function (socket) {
		socket.on('move', function (data) {
            var lin = data.lin;
            var ang = data.ang;
            var data = {lin_ang_vel: {
                lin: lin,
                ang: ang
            }};

            var bot = powerbot.get();
            console.log('move', data);
            powerbot.write(bot, data);
		});

        var bot = powerbot.get();
        bot.on('data', function(data) {
            data = data.replace(/\0/g, '');
            var ds = data.split("///");
            for(var i = 0; i < ds.length; i++) {
                data = ds[i];
                if(data.length == 0) continue;
                data = data.replace(/\0/g, '');
                try {
                    data = JSON.parse(data);
                    socket.broadcast.emit('log', data);
                } catch(e) {
                    console.log('json parsing error', data, e);
                }
            }
        })

		socket.on('stop', function (data) {
		});

		socket.on('disconnect', function () {
		});
	});

    return io;
}

module.exports = connect;
