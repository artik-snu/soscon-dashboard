var deviceId = "c96d79838cf947948e38c592fd1224c8";
var deviceToken = "e89e803f0a5f47e397da2700982efc90";

var ArtikCloud = require('artikcloud-js');
var defaultClient = new ArtikCloud.ApiClient();

// Configure OAuth2 access token for authorization: artikcloud_oauth
defaultClient.authentications['artikcloud_oauth'].key = 'Authorization';
defaultClient.authentications['artikcloud_oauth'].access_token = 'Bearer ' + deviceToken;
defaultClient.authentications['artikcloud_oauth'].in = 'header';
defaultClient.authentications['artikcloud_oauth'].value = 'Bearer ' + deviceToken;
defaultClient.defaultHeaders['Authorization'] = 'Bearer ' + deviceToken;

var apiInstance = new ArtikCloud.MessagesApi()

var data = new ArtikCloud.Message(); // {Message} Message object that is passed in the body
data.sdid = deviceId;
data.data = {
	'Traffic': 10,
	'Velocity': 10
}
data.ts = (new Date()).getTime();

var callback = function(error, data, response) {
	if (error) {
		console.error(error);
	} else {
		console.log('API called successfully. Returned data: ' + data);
	}
};
apiInstance.sendMessage(data, callback);
console.log(defaultClient);
