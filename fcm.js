var FCM = require('fcm-push');

var serverKey = 'AIzaSyDA1sLjFirkVcWTJTsbXsNIYVN4C7hj_YU';
var fcm = new FCM(serverKey);

var dtoken = "cnUxhV4U3Ig:APA91bG3_VtsKJlaz1KgXdeouQKCksvS3ggzFac9Izvqv09yWc54zDtHahX6hvkEHnQSFUJTXEF-zozwAK955-XQzoA76tTnGA_0AqbneU7Lyx5qbhYtTIddD7nBYp2ArI2DGzbcza-k";
var dtoken = "fFFbTjMQtHI:APA91bFxwp4iPuNUSbq60cdYgr8-j2cyis7j64d7_i_pjmAiMBKnRUJbffV1-vHgGMlJDCrPjwRcnS2ZeSPCyj5G4B8m-i-MZrcNLT_JVhiN8sMfORdtSoDK_8a5gW_Low_lstAdnD6e";

var message = {
    to: dtoken, // required fill with device token or topics
    collapse_key: "" + parseInt(Math.random() * 100), 
    data: {
    },
    notification: {
        title: 'Title of your push notification',
        body: 'Body of your push notification'
    }
};

//callback style
fcm.send(message, function(err, response){
    if (err) {
        console.log("Something has gone wrong!", response);
    } else {
        console.log("Successfully sent with response: ", response);
    }
});
