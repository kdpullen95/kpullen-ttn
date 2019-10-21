var verbose = false;
var objExpand = false;
var mongoDB;
var _this; //TODO remove this, it's clunky? But improves readability over module.exports?
var reqFunctions = ["init", "processMessage"]; //TODO move this to a file or something
var sharedCollectionsTxt = ["userSettings", "resources", "charSheets"]; //TODO ditto
var userCollection;
var modFunctions = {};

//****************************************************************************

module.exports = {

  sharedCollections: {},

  init: async function(panelList, mongoClient, databaseName, adminPanelName) {
    _this = this;
    await dbStartup(mongoClient, databaseName);
    await initOtherCollections();
    await initPanels(panelList);
    passUserCollectionTo(adminPanelName);
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
      if (modFunctions[message.from.type]) {
        message = modFunctions[message.from.type].processMessage(message);
      }
    }
    return message;
  },

  //&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
  //&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
  //&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&MONGO&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&

  checkPermission: function (user, permissionCode, type) {
    //types v - view, e - edit, c - control
    //TODO access user collection and checks to see if they have that permission or not, boolean return
    //permissioncodes are in the format of 'type-identifier', where the type is the type of permission
    //and identifier is the subtype, so permission to see things flagged as 'foo' in the database would
    //be chceked via checkPermission(userName, 'resourcePanel-flag:foo', 'v') or similar. Permissions can only
    //be set by someone with checkPermission(user, permissionCode, 'c') for a specific code
    return true;
  },

  setPermission: function (authUser, user, permissionCode, to) {
    if (this.checkPermission(authUser, permissionCode, 'c')) {
      //todo set permission of user for permissionCode to to
    } else {
      throw new Error("User " + authUser + " not authorized to set permissions on " + permissionCode);
    }
  },

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

  setVerbosity: function(v, f) {
    verbose = v;
    funVerbose = f;
  },

  log: function(prefix, strArray, force=false) {
    if (!verbose && !force) return;
    str = '';
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
      compatEval(mod); //evaluates mod to ensure it has expected functions & files
      mod.init(_this, panelList[i], await mongoDB.collection(panelList[i]));
      _this.log(_this.prefix.function, [panelList[i], " successfully initialized."], true);
      modFunctions[panelList[i]] = mod; //separation allows modFunctions to still work
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
    throw new Error("Panel module missing required index.html file.");
  }
}

async function initOtherCollections() {
  await sharedCollectionsTxt.forEach(async function(element) {
    _this.sharedCollections[element] = await mongoDB.collection(element);
  });
  userCollection = await mongoDB.collection("users");
  _this.log(_this.prefix.mongo, ["standalone collections initialized."]);
}

function passUserCollectionTo(adminPanelName) {
  if (modFunctions[adminPanelName] && typeof modFunctions[adminPanelName].setUserCollection === 'function') {
    modFunctions[adminPanelName].setUserCollection(userCollection);
  } else {
    _this.log(_this.prefix.function, ["Admin panel not correctly configured or failed to load. Admin actions will not be accessible."], true);
  }
}

async function dbStartup(mongoClient, databaseName) {
  var client = await mongoClient.connect('mongodb://localhost/' + databaseName, { useNewUrlParser: true });
  mongoDB = client.db(databaseName);
  _this.log(_this.prefix.mongo, ["database name '", databaseName, "' connected!"]);
}

function closeDB() {
  if (mongoDB) { //TODO check if live
    _this.log(_this.prefix.mongo, ["(EXIT) closing open database: ", databaseName]);
    mongoDB.close();
  }
}
