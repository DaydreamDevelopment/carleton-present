// Load required modules
var http = require("http"); // http server core module
var express = require("express"); // web framework external module
var io = require("socket.io"); // web socket external module
var easyrtc = require("easyrtc"); // EasyRTC external module
var request = require('request');

// Setup and configure Express http server. Expect a subfolder called "static" to be the web root.
var httpApp = express();
httpApp.use(express.static(__dirname + "/static/"));

// Start Express http server on port 8080
var webServer = http.createServer(httpApp).listen(8080);

// Start Socket.io so it attaches itself to Express server
var socketServer = io.listen(webServer, {
  "log level": 1
});

easyrtc.setOption("logLevel", "debug");

// Overriding the default easyrtcAuth listener, only so we can directly access its callback
easyrtc.events.on("easyrtcAuth", function (socket, easyrtcid, msg, socketCallback, callback) {
  easyrtc.events.defaultListeners.easyrtcAuth(socket, easyrtcid, msg, socketCallback, function (err, connectionObj) {
    if (err || !msg.msgData || !msg.msgData.credential || !connectionObj) {
      callback(err, connectionObj);
      return;
    }

    connectionObj.setField("credential", msg.msgData.credential, {
      "isShared": false
    });

    console.log("[" + easyrtcid + "] Credential saved!", connectionObj.getFieldValueSync("credential"));

    callback(err, connectionObj);
  });
});

// To test, lets print the credential to the console for every room join!
easyrtc.events.on("roomJoin", function (connectionObj, roomName, roomParameter, callback) {
  console.log("[" + connectionObj.getEasyrtcid() + "] Credential retrieved!", connectionObj.getFieldValueSync("credential"));
  easyrtc.events.defaultListeners.roomJoin(connectionObj, roomName, roomParameter, callback);
});

easyrtc.on("getIceConfig", function (connectionObj, callback) {

  // This object will take in an array of XirSys STUN and TURN servers
  var iceConfig = [];

  request({
      url: 'https://service.xirsys.com/ice',
      qs: {
        ident: "braydengirard",
        secret: "ba06132e-20fa-11e6-880c-c3e37a350ddf",
        domain: "www.daydream-interactive-present.com",
        application: "default",
        room: "default",
        secure: 1
      },
      json: true
    },
    function (error, response, body) {
      if (!error && response.statusCode == 200) {
        // body.d.iceServers is where the array of ICE servers lives
        console.log(body);
        iceConfig = body.d.iceServers;
        console.log(iceConfig);
        callback(null, iceConfig);
      }
    });
});

var onAuthenticate = function (socket, easyrtcid, appName, username, credential, easyrtcAuthMessage, next) {
  if (credential.apikey === 'TIMG5103bgcppm') {
    next(new easyrtc.util.ConnectionError("Failed our private auth."));
  } else {
    next(null);
  }
};

easyrtc.events.on("authenticate", onAuthenticate);


// Start EasyRTC server
var rtc = easyrtc.listen(httpApp, socketServer, null, function (err, rtcRef) {
  console.log("Initiated");

  rtcRef.events.on("roomCreate", function (appObj, creatorConnectionObj, roomName, roomOptions, callback) {
    console.log("roomCreate fired! Trying to create: " + roomName);

    appObj.events.defaultListeners.roomCreate(appObj, creatorConnectionObj, roomName, roomOptions, callback);
  });
});
