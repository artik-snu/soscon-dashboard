var firebase = require('firebase');
var admin = require('firebase-admin');
var serviceAccount = require("../soscon-96a4b-firebase-adminsdk-2gz97-70dddb2d84.json")

admin.initializeApp({
    databaseURL: 'https://soscon-96a4b.firebaseio.com/',
    credential: admin.credential.cert(serviceAccount)
});

var db = admin.database();
console.log('connect to firebase');

module.exports = db;
