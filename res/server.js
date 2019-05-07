const express = require('express');
const app = express();
const path = require('path');
const mongo = require('mongodb').MongoClient;
const util = require('util')
const server = require('http').Server(app);
const io = require('socket.io')(server);
const fs = require('fs');

const port = 8090;
const verbose = 1;
const socketPref =  '>>>>>>SOCKET.io>>>>>>>  ';
const mongoPref =   '######MONGOdb#########  ';
const expressPref = '******EXPRESSjs*******  ';
const defPref =     '------DEFAULTmsg------  ';

var databaseName = "testing";
var daturl = 'mongodb://localhost/' + databaseName;
var statloc = path.join(__dirname, "static");

var panelList = fs.readdirSync(__dirname + "/static/panels/");
log(defPref + panelList.toString());

//https://www.npmjs.com/package/mongodb <-- for better conn protocol
mongo.connect(daturl, function(err, db) {
  log(mongoPref + "database name '" + databaseName + "' connected!");
  //db.close(); Can't close a db that doesn't have anything in it, mongo doesn't allow that
});
//socket function
io.on('connection', function(socket) {
  log(socketPref + 'user connected');
  socket.on('db', function(msg){
    log(socketPref + 'received message: ' + msg);
    socket.broadcast.emit('upd', msg);
  });
  socket.on('disconnect', function(){
    log(socketPref + 'user disconnected');
  });
});

/* Logs every connection, regardless of type, then forwards to next funcion */
app.use(function (req, res, next) {
  log(expressPref + req.method + " request at " + new Date().toString() + " for: " + req.url);
  next();
});

//TODO: COMBINE THESE INTO ONE INPUT VALIDATED THING
app.get('/scripts/plain-draggable.js', function(req, res) {
  res.sendFile('node_modules/plain-draggable/plain-draggable.min.js', { root: __dirname + '/../'});
});

app.use(express.static(statloc));

app.post('/', function (req, res) {
  res.send("post get")
});

server.listen(port, () => console.log(expressPref + 'listening on port ' + port))

function log(str) {
  if (verbose) console.log(str);
}
