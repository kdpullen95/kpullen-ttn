//OUTSIDE UTILITIES
const express = require('express');
const app = express();
const path = require('path');
const mongo = require('mongodb').MongoClient;
const util = require('util')
const server = require('http').Server(app);
const io = require('socket.io')(server);
const fs = require('fs');
const func = require('./kfunctions.js');
//COMMAND-LINE OPTIONS
const databaseName = typeof(process.argv[2]) !== 'undefined' ? process.argv[2] : 'default'; //2
const port = 8090; //3 TODO
func.setVerbose(process.argv[4] === 't'); //4
func.setFuncVerbose(process.argv[5] === 't'); //5
func.setObjExpand(process.argv[6] === 't'); //6
//end COMMAND-LINE OPTIONS

//TODO - at some point, this block will be moved to the C++ executable
//why: security. then panelList will be part of command-line options
var daturl = 'mongodb://localhost/' + databaseName;
var statloc = path.join(__dirname, "static");
var panelList = fs.readdirSync(__dirname + "/static/panels/");
//end TODO

func.init(panelList);

//https://www.npmjs.com/package/mongodb <-- for better conn protocol
mongo.connect(daturl, function(err, db) {
  func.log(func.prefix.mongo, ["database name '", databaseName, "' connected!"]);
  //db.close(); not allowed to close a db that doesn't have anything in it
});

//socket function
io.on('connection', function(socket) {
  func.log(func.prefix.socket, ['user connected']);
  socket.on('serv', function(msg){
    func.log(func.prefix.socket, ['received message: ', msg]);
    msg = func.processMessage(msg, mongo, socket);
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

server.listen(port, () => func.log(func.prefix.express, ['listening on port ', port], true))
