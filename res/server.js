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
//OPTIONS
const databaseName = typeof(process.argv[2]) !== 'undefined' ? process.argv[2] : 'default'; //2
const port = 8090; //3 TODO
func.setVerbose(process.argv[4] === 't' ? true : false); //4
func.setFuncVerbose(process.argv[5] === 't' ? true : false); //5
func.setObjExpand(process.argv[6] === 't' ? true : false); //6
//

var daturl = 'mongodb://localhost/' + databaseName;
var statloc = path.join(__dirname, "static");

var panelList = fs.readdirSync(__dirname + "/static/panels/");
func.log(func.pref.default, [panelList.toString()]);
func.init(panelList);

//https://www.npmjs.com/package/mongodb <-- for better conn protocol
mongo.connect(daturl, function(err, db) {
  func.log(func.pref.mongo, ["database name '", databaseName, "' connected!"]);
  //db.close(); Can't close a db that doesn't have anything in it, mongo doesn't allow that
});

//socket function
io.on('connection', function(socket) {
  func.log(func.pref.socket, ['user connected']);
  socket.on('serv', function(msg){
    func.log(func.pref.socket, ['received message: ', msg]);
    msg = func.processMessage(msg, mongo, socket);
    io.emit('upd', msg);
  });
  socket.on('disconnect', function(){
    func.log(func.pref.socket, ['user disconnected']);
  });
});

/* Logs every connection, regardless of type, then forwards to next funcion */
app.use(function (req, res, next) {
  func.log(func.pref.express, [req.method, " for: ", req.url]);
  next();
});

app.use(express.static(statloc));

server.listen(port, () => func.log(func.pref.express, ['listening on port ', port], true))
