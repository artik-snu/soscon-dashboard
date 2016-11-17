var net = require('net');

//var host = "192.168.123.169";
var host = "192.168.0.8";
var port = 5000;
var client = null;

function connect(callback) {
    if(client != null) client;
	client = net.connect({port: port, host: host}, function() {
        console.log('connected');
		this.setTimeout(1000);
		this.setEncoding('utf8');
		this.setKeepAlive(true);
		callback();
	});
	client.on('end', function() {
		console.log('disconnected');
	});
	client.on('error', function(err) {
		console.log('error: ', err);
	});
	client.on('timeout', function() {
//		console.log('time out');
	});
	client.on('close', function() {
		console.log('closed');
        client = null;
	});

    return client;
}

function get() {
    return client;
}

function write(socket, data) {
    var json = JSON.stringify(data);
    console.log(json);

    if(socket == null) {
        console.log('socket is null');
        return;
    }

    socket.write(json, function(err) {
        socket.once('drain', function(){
            write(socket, json);
        });
    });
}

module.exports = {
    connect: connect,
    get: get,
    write: write
}
