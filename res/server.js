//OUTSIDE UTILITIES
//  post/get server for login and static resources, like panels before init
const express = require('express');
const app = express();
const server = require('http').Server(app);
//  passport: user authentication?
//const passport = require('passport');
//  socket.io for SPA page
const io = require('socket.io')(server);
//  mongo: storing files, users
const mongoClient = require('mongodb').MongoClient;
//  misc for loading and accessing files
const util = require('util');
const fs = require('fs');
const path = require('path');
//end OUTSIDE UTILITIES

//  func: logging, message handling, panel init
const func = require('./kfunctions.js');

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
//end CLEANUP

//TODO - at some point, this block will be moved to the C++ executable
//why: security. then panelList will be part of command-line options
var statloc = path.join(__dirname, "static");
var panelList = fs.readdirSync(__dirname + "/static/main/panels/");
var activeUsers = {};
//end TODO

//INITIALIZATION
initialize();
//forces this to complete before the server is open for business using chains of awaits
//todo probably could turn this last one into a callback instead
async function initialize() {
  await func.init(panelList, mongoClient, databaseName, adminPanelName);
  func.log(func.prefix.default, 'database & panels initialization completed');
  //the above MUST complete before any connections are accepted.
  runServer();
}
//end INITIALIZATION

function runServer() {
  //socket function
  io.on('connection', function(socket) {
    func.log(func.prefix.socket, ['user connected']);
    socket.on('serv', async function(message){
      func.log(func.prefix.socket, ['received message: ', message]);
      try {
        messageCollection = await func.processMessage(message);
        sendResponses(messageCollection, socket, io);
      } catch (e) {
        func.log(func.prefix.socket, ['error processing message: ', message, '. error ->']);
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


//messageCollection = [{message: messageObject, emitType: string}, {mess...ring}]
////emit types: sender, all, allExceptSender
function sendResponses(messageCollection, socket, io) {
  messageCollection.forEach( (messagePair) => {
    func.log(func.prefix.socket, ['sending message: ', messagePair]);
    switch(messagePair.emitType) {
      case 'sender':
        socket.emit('res', messagePair.message);
        break;
      case 'all':
        io.emit('res', messagePair.message);
        break;
      case 'allExceptSender':
        socket.broadcast.emit('res', messagePair.message);
        break;
      case 'individualUsers':
        break; //todo awaiting fancy socket-user-key array
      default:
        break;
    }
  });
}

function addJWTUserKey(user) { //ignore
  activeUsers[user] = Math.random() * 10000 + '***' + user + '***' + Math.random() * 10000;
}
