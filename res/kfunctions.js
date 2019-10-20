var verbose = false;
var objExpand = false;
var funcVerbose = false;
var mongoDB;
var _this; //todo remove this, it's clunky.
          //currently used to access this in functions not within the
          //module.exports scope, 'cause I don't know a better way 

//****************************************************************************

module.exports = {

  modFunctions: {},

  init: function(panelList, mongoClient, databaseName) {
    _this = this;
    dbStartup(mongoClient, databaseName);
    this.log(this.prefix.function, "Loading server-side panel files...", true);
    for (var i in panelList) {
      try {
        var mod = require('./static/panels/' + panelList[i] + '/server.js');
        mod.init(this, panelList[i], mongoClient);
        this.log(this.prefix.function, [panelList[i], " successfully initialized."], true);
        this.modFunctions[panelList[i]] = mod; //separation allows modFunctions to still work
                                            //on the rest of them even if try/catch is called
      } catch (e) {
        this.log(this.prefix.function, [panelList[i], " failed to initialize. Error: ", e]);
      }
    }
  },

  safeExit: function() {
    closeDB();
  },

  prefix:  {
    socket:         '>>>>>>SOCKET.io>>>>>>>',
    mongo:          '######MONGOdb#########',
    express:        '******EXPRESSjs*******',
    default:        '------DEFAULTmsg------',
    function:       '%%%%%%kfunctions%%%%%%',
    error:          '!!!!!!!!ERROR!!!!!!!!!',
  },

  //****************************************************************************
  //****************************************************************************
  //*********************MESSAGE PROCESSING & RESPONSE**************************

  processMessage: function(message, socket, io) {
    if (message.from && message.from.type) {
      if (message.action && message.action === 'initPanel') {
        this.createPanel(message);
      } else
      if (this.modFunctions[message.from.type]) {
        message = this.modFunctions[message.from.type].processMessage(message, mongoDB, socket, io);
      }
    }
    return message;
  },

  //&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
  //&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
  //&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&MONGO&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&

  createPanel: function(message) {
    message.content = {};
    message.content.id = message.from.id == '0' ? this.assignID(message.from.type) : message.from.id;
    message.content.loc = this.getSizeValues(message.from.type, message.content.id);
    message.content.type = message.from.type;
    return message;
  },

  //TODO
  assignID: function(type) {
    return Math.floor(Math.random() * 10000);
  },

  //TODO
  getSizeValues: function(type, id) {
    return {width: 400, height: 400, top: 0, left: 0};
  },

  //============================================================================
  //============================================================================
  //========================DEBUG HELPER METHODS================================

  setVerbose: function(v) {
    verbose = v;
  },

  setObjExpand: function(o) {
    objExpand = o;
  },

  setFuncVerbose: function(v) {
    funcVerbose = v;
  },

  log: function(prefix, strArray, force=false) {
    if ((!verbose && !force) ||
        (!funcVerbose && prefix.startsWith(this.prefix.function))) return;
    str = ''; //TODO fix the above so that force works with funcVerbose
    for (var s in strArray) {
      str += readify(strArray[s]);
    }
    console.log(dateline(prefix) + str);
  },

  error: function(error, exit=true) {
    this.log(this.prefix.error, [error.stack], true);
    if (exit) process.exit();
  }

}

//============================================================================
//============================================================================
//========================DEBUG HELPER METHODS================================

function readify(obj) {
  return (objExpand && typeof(obj) === 'object') ? JSON.stringify(obj) : obj;
}

function dateline(str) {
  d = new Date();
  return "||" + d.toLocaleString() + "|| " + str + "  ";
}

//&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
//&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
//&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&MONGO&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&

function dbStartup(mongoClient, databaseName) {
  mongoClient.connect('mongodb://localhost/' + databaseName, { useNewUrlParser: true },
                                                                    (err, client) => {
    if (err) throw err;
    _this.log(_this.prefix.mongo, ["database name '", databaseName, "' connected!"]);
    mongoDB = client.db(databaseName);
    //todo if empty firsttimesetup
  });
}

function closeDB() {
  if (mongoDB) { //TODO check if live
    _this.log(_this.prefix.mongo, ["(EXIT) closing open database: ", databaseName]);
    mongoDB.close();
  }
}
