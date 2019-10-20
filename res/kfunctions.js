var verbose = false;
var objExpand = false;
var funcVerbose = false;
var mongoDB;
var _this; //TODO remove this, it's clunky? But improves readability over module.exports?
var reqFunctions = ["init", "processMessage"]; //TODO move this to a file or something
var sharedCollectionsTxt = ["userSettings", "resources", "charSheets"]; //TODO ditto

//****************************************************************************

module.exports = {

  sharedCollections: {},

  modFunctions: {},

  init: async function(panelList, mongoClient, databaseName) {
    _this = this;
    await dbStartup(mongoClient, databaseName);
    await initSharedCollections();
    await initPanels(panelList);
  },

  safeExit: function() {
    closeDB();
  },

  prefix:  {
    socket:         '>>>>>>SOCKET.io>>>>>>>',
    mongo:          '#######MONGOdb########',
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
        message = this.modFunctions[message.from.type].processMessage(message);
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

  error: function(error, stack=true, exit=false) {
    var err = [error.message];
    if (stack) err.push(error.stack);
    this.log(this.prefix.error, err, true);
    if (exit) process.exit(1);    //TODO process.exit() vs process.errorCode
                                      //need to gracefully exit.
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

async function initPanels(panelList) {
  _this.log(_this.prefix.function, "Loading server-side panel files...", true);
  for (var i in panelList) {
    try {
      var mod = require('./static/panels/' + panelList[i] + '/server.js');
      compatEval(mod);
      mod.init(_this, panelList[i], await getCollection(panelList[i]));
      _this.log(_this.prefix.function, [panelList[i], " successfully initialized."], true);
      _this.modFunctions[panelList[i]] = mod; //separation allows modFunctions to still work
                                          //on the rest of them even if try/catch is called
    } catch (e) { //TODO are there any important errors that should be let through?
      _this.log(_this.prefix.function, [panelList[i], " failed to initialize. error ->"]);
      _this.error(e, false);
    }
  }
}

function compatEval(mod) {
  reqFunctions.forEach(function(element) {
    if (typeof mod[element] !== "function") throw new Error("Module missing required function.");
  });
  if (false) { //TODO check for file compat
    throw new Error("Module missing required index files.");
  }
}

async function initSharedCollections() {

}

async function dbStartup(mongoClient, databaseName) {
  var client = await mongoClient.connect('mongodb://localhost/' + databaseName, { useNewUrlParser: true });
  mongoDB = client.db(databaseName);
  _this.log(_this.prefix.mongo, ["database name '", databaseName, "' connected!"]);
}

async function getCollection(type) {
  return await mongoDB.collection(type);
}

function closeDB() {
  if (mongoDB) { //TODO check if live
    _this.log(_this.prefix.mongo, ["(EXIT) closing open database: ", databaseName]);
    mongoDB.close();
  }
}
