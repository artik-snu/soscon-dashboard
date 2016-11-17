var streaming = null;
var spinner = null;

var CCTV = function() {
	this.janus = null;
	this.started = false;
	//this.server = "https://janus.conf.meetecho.com/janus";
	//this.server = "http://192.168.123.111:8088/janus";
	this.server = "http://192.168.0.6:8088/janus";
}

CCTV.prototype.init =  function() {
	Janus.init({debug: "all", callback: function() {
		// Use a button to start the demo
	}});
}

CCTV.prototype.start = function() {
	if(this.started)
		return;
	this.started = true;

	janus = new Janus(
		{
			server: this.server,
			success: function() {
				// Attach to streaming plugin
				janus.attach(
					{
						plugin: "janus.plugin.streaming",
						success: function(pluginHandle) {
							streaming = pluginHandle;
							Janus.log("Plugin attached! (" + streaming.getPlugin() + ", id=" + streaming.getId() + ")");
						},
						error: function(error) {
							Janus.error("  -- Error attaching plugin... ", error);
						},
						onmessage: function(msg, jsep) {
							Janus.debug(" ::: Got a message :::");
							Janus.debug(JSON.stringify(msg));
							var result = msg["result"];
							if(result !== null && result !== undefined) {
								if(result["status"] !== undefined && result["status"] !== null) {
									var status = result["status"];
									if(status === 'starting')
										$('#status').removeClass('hide').text("Starting, please wait...").show();
									else if(status === 'started')
										$('#status').removeClass('hide').text("Started").show();
									else if(status === 'stopped')
										stopStream();
								}
							} else if(msg["error"] !== undefined && msg["error"] !== null) {
								stopStream();
								return;
							}
							if(jsep !== undefined && jsep !== null) {
								Janus.debug("Handling SDP as well...");
								Janus.debug(jsep);
								// Answer
								streaming.createAnswer(
									{
										jsep: jsep,
										media: { audioSend: false, videoSend: false },	// We want recvonly audio/video
										success: function(jsep) {
											Janus.debug("Got SDP!");
											Janus.debug(jsep);
											var body = { "request": "start" };
											streaming.send({"message": body, "jsep": jsep});
										},
										error: function(error) {
											Janus.error("WebRTC error:", error);
										}
									});
							}
						},
						onremotestream: function(stream) {
							Janus.debug(" ::: Got a remote stream :::");
							Janus.debug(JSON.stringify(stream));
                            $("#stream_html5_api").bind("playing", function () {
                                if(spinner !== null && spinner !== undefined) {
                                    spinner.stop();
                                    waitingDialog.hide();
                                }
                                spinner = null;
							});
							Janus.attachMediaStream($('#stream_html5_api').get(0), stream);
						},
						oncleanup: function() {
							Janus.log(" ::: Got a cleanup notification :::");
						}
					});
			},
			error: function(error) {
				Janus.error(error);
				//window.location.reload();
			},
			destroyed: function() {
				window.location.reload();
			}
		});
}

CCTV.prototype.startStream = function() {
	selectedStream = 1;
	Janus.log("Selected video id #" + selectedStream);
	var body = { "request": "watch", id: parseInt(selectedStream) };
	streaming.send({"message": body});
    if(spinner == null) {
        setTimeout(function() {
            var target = document.getElementById('stream');
            spinner = new Spinner({top:50}).spin(target);
        }, 1000);
        waitingDialog.show('Connecting...');
    } else {
        spinner.spin();
    }
}

CCTV.prototype.stopStream = function() {
	var body = { "request": "stop" };
	streaming.send({"message": body});
	streaming.hangup();
}
