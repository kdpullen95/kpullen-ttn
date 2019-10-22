//OUTSIDE UTILITIES
//express, app: expressjs server stuff
const express = require('express');
const app = express();
const path = require('path');
//mongo: storing files, users
const mongoClient = require('mongodb').MongoClient;
const util = require('util');
const server = require('http').Server(app);
const io = require('socket.io')(server);
const fs = require('fs');
//func: logging and message handling
const func = require('./kfunctions.js');
//passport: user authentication
const passport = require('passport');
//end OUTSIDE UTILITIES

//COMMAND-LINE OPTIONS
// server.js databseName port adminPanelName setVerbose setObjExpand
const databaseName = typeof process.argv[2] !== 'undefined' ? process.argv[2] : 'default'; //2
const port = 8090; //3 TODO
const adminPanelName = typeof process.argv[4] !== 'undefined' ? process.argv[4] : 'adminPanel'; //4
//below is written as ! a === 'f' so that the default if no arguments given (undef) is t
func.setVerbose(!(process.argv[5] === 'f')); //5
//end COMMAND-LINE OPTIONS

//CLEANUP
process.on('exit', (code) => {
  func.log(func.prefix.default, ['beginning EXIT cleanup, code ', code]);
  func.safeExit();
});
//END CLEANUP

//TODO - at some point, this block will be moved to the C++ executable
//why: security. then panelList will be part of command-line options
var statloc = path.join(__dirname, "static");
var panelList = fs.readdirSync(__dirname + "/static/main/panels/");
var activeUsers = {};
//end TODO

initialize();

//forces this to complete before the next using chains of awaits
//TODO figure out if there's a cleaner way to do this.
async function initialize() {
  await func.init(panelList, mongoClient, databaseName, adminPanelName);
  func.log(func.prefix.default, 'database & panels initialization completed');
  //the above MUST complete before any connections are accepted.
  runServer();
}

function runServer() {
  //socket function
  io.on('connection', function(socket) {
    func.log(func.prefix.socket, ['user connected']);
    socket.on('serv', function(msg){
      func.log(func.prefix.socket, ['received message: ', msg]);
      try {
        msg = func.processMessage(msg, socket, io);
        func.log(func.prefix.socket, ['sent message: ', msg]);
        io.emit('upd', msg);
      } catch (e) {
        func.log(func.prefix.socket, ['error processing or sending message: ', msg, '. error ->']);
        func.error(e);
      }
    });
    socket.on('disconnect', function(){
      func.log(func.prefix.socket, ['user disconnected']);
    });
  });

  app.use(express.urlencoded({extended: true}));

  /* Logs every non-socket connection, regardless of type, then forwards to next functSion */
  app.use(function (req, res, next) {
    func.log(func.prefix.express, [req.method, " for: ", req.url]);
    next();
  });

  app.use(express.static(statloc));

  app.post('/',function(req, res) {
    //TODO what am I doing
    //TODO client side + server side hashing with option of SSL instead if provided cert
    //TODO security is hard
    var user = req.body.username;
    var password = req.body.password;
    var loginSuccess = {username: user, key: 'something'};
    if (func.authUser(user, password)) {
      addJWTUserKey(user);
      res.json(loginSuccess);
    }
    res.end('nope');
  });

  server.listen(port, () => func.log(func.prefix.express, ['listening on port ', port], true));
}

function addJWTUserKey(user) {
  activeUsers[user] = Math.random() * 10000 + '***' + user + '***' + Math.random() * 10000;
}
