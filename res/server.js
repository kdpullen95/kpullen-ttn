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
const databaseName = typeof(process.argv[2]) !== 'undefined' ? process.argv[2] : 'default'; //2
const port = 8090; //3 TODO
func.setVerbose(process.argv[4] === 't'); //4
func.setFuncVerbose(process.argv[5] === 't'); //5
func.setObjExpand(process.argv[6] === 't'); //6
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
var panelList = fs.readdirSync(__dirname + "/static/panels/");
//end TODO

initialize();

//forces this to complete before the next using chains of awaits
//TODO figure out if there's a cleaner way to do this.
async function initialize() {
  await func.init(panelList, mongoClient, databaseName);
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
      msg = func.processMessage(msg, socket, io);
      func.log(func.prefix.socket, ['sent message: ', msg]);
      io.emit('upd', msg);
    });
    socket.on('disconnect', function(){
      func.log(func.prefix.socket, ['user disconnected']);
    });
  });

  /* Logs every connection, regardless of type, then forwards to next funcion */
  app.use(function (req, res, next) {
    func.log(func.prefix.express, [req.method, " for: ", req.url]);
    next();
  });

  app.use(express.static(statloc));

  server.listen(port, () => func.log(func.prefix.express, ['listening on port ', port], true));
}
