//OUTSIDE UTILITIES
//  post/get server for login and static resources, like panels before init
const express = require('express');
const app = express();
const server = require('http').Server(app);
//  passport: user authentication?
//const passport = require('passport');
//  socket.io for SPA page
const io = require('socket.io')(server);
//  mongo: storing files, users, generating ids
const mongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
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

var activeUsers = {};

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
//end TODO

var themeList = fs.readdirSync(__dirname + "/static/css/themes/");

//INITIALIZATION
initialize();
//forces this to complete before the server is open for business using chains of awaits
async function initialize() {
  await func.init(panelList, mongoClient, databaseName, adminPanelName, themeList);
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
      if (!authUserKey(message)) {
        func.log(func.prefix.socket, ['incorrectly authorized or unauthorized user ' + message.user + ' rejected & socket closed'])
        socket.disconnect();
      }
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

  app.use(express.json());

  /* Logs every non-socket connection, regardless of type, then forwards to next functSion */
  app.use(function (req, res, next) {
    func.log(func.prefix.express, [req.method, " for: ", req.url]);
    next();
  });

  app.use(express.static(statloc));

  app.post('',function(req, res) {
    //TODO client side + server side hashing with option of SSL instead if provided cert
    //TODO security is hard
    if (func.authUser(req.body.user, req.body.pin)) {
      addUserKey(req.body.user);
      res.json({user: req.body.user, k: activeUsers[req.body.user].k});
    } else {
      res.json({incorrect: true});
    }
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

function authUserKey(message) { //wholly unfinished/bad security,
  //but sets the stage for permissions, so
  return activeUsers[message.user.name].k === message.user.k
}

function addUserKey(user) { //wholly unfinished
  activeUsers[user] = {k: new ObjectID().toHexString(), expiry: new Date()};
}
