var verbose = true;
var mongoDB;
const reqFunctions = ["init", "processMessage", "getSizeValues", "assignID", "signalVisibility", "getSavedPanels", "request"]; //TODO move this to a file or something
const sharedCollectionsTxt = ["userSettings", "resources", "charSheets", "stateTemplates"]; //TODO ditto
var userCollection;
var modFunctions = {}; //access to specific panels files
var stateObj = {}; //keeps a running record of the current state of panels
const ObjectID = require('mongodb').ObjectID;

//****************************************************************************

module.exports = {

  panelsList: {}, //list of panel names

  sharedCollections: {},

  init: async function(panelList, mongoClient, databaseName, adminPanelName) {
    await dbStartup(mongoClient, databaseName);
    await initOtherCollections();
    await initPanels(panelList);
    passUserCollectionTo(adminPanelName);
  },

  safeExit: function() {
    closeDB();
  },

  prefix:  {
    socket:   '>>>>>>SOCKET.io>>>>>>>',     mongo:    '#######MONGOdb########',
    express:  '******EXPRESSjs*******',     default:  '------DEFAULTmsg------',
    function: '%%%%%%kfunctions%%%%%%',     error:    '!!!!!!!!ERROR!!!!!!!!!',
  },

  //****************************************************************************
  //****************************************************************************
  //*********************MESSAGE PROCESSING & RESPONSE**************************

  //messageCollection = [{message: messageObject, emitType: string}, {mess...ring}]
  ////emit types: sender, all, allExceptSender
  processMessage: async function(message, socket, io) {
    switch (message.action) {
      case 'synchronize':
        return await synchronizeState();
      case 'saveCurrentTemplate':
        return await saveCurrentTemplate(message);
      case 'loadTemplate':
        return await loadTemplate(message);
      case 'loadPanel':
        return setLoadToCreate(message);
      case 'createPanel':
        return affirmAndPassOn(this.assignValues(message));
      case 'movePanel':
      case 'resizePanel':
      case 'closePanel':
          return affirmAndPassOn(message);
      default: //todo operate on appl, not from?
        if (modFunctions[message.from.type])
          return await modFunctions[message.from.type].processMessage(message);
    }
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

  authUser: function(user, pin) {
    return true; //TODO
  },

  assignValues: function(message) {
    message.content = { id: message.from.id.toString().startsWith('DEFAULTID') ? this.assignID(message.from.type) : message.from.id,
                        type: message.from.type };
    message.content.loc = this.getSizeValues(message.from.type, message.content.id);
    return message;
  },

  assignID: function(type) {
    return modFunctions[type].assignID();
  },

  getSizeValues: function(type, id) {
    return modFunctions[type].getSizeValues(id);
  },

  getSavedPanels: async function(message) {
    var co = {};
    var keyArray = Object.keys(this.panelsList);
    for (var i = 0; i < keyArray.length; i++) {
      co[keyArray[i]] = await modFunctions[keyArray[i]].getSavedPanels(message);
    }
    // Object.keys(this.panelsList).forEach(function (key) {
    //   co[key] = await modFunctions[key].getSavedPanels();
    // });    //is there a way to easily await all of these?
    return co;
  },

  //============================================================================
  //============================================================================
  //========================DEBUG & HELPER METHODS==============================
  shallowClone: function(obj) {
    return Object.assign({}, obj);
  },

  deepClone: function(obj) {
    return 'TODO'; //TODO
  },

  setVerbose: function(v) {
    verbose = v;
  },

  log: function(prefix, strArray, force=false) {
    if (!verbose && !force) return;
    str = '';
    for (var s in strArray) {
      str += typeof strArray[s] === 'object' ? JSON.stringify(strArray[s]) : strArray[s];
    }
    console.log(dateline(prefix) + str);
  },

  error: function(error, stack=true, exit=false) {
    var err = [error.message];
    if (stack) err.push(error.stack);
    this.log(this.prefix.error, err, true);
    if (exit) process.exit(1);    //TODO process.exit() vs process.errorCode?
                                      //need to gracefully exit.
  }

}

var _this = module.exports;
//TODO remove this, it's clunky? But improves readability over using module.exports?

//============================================================================
//============================================================================
//========================DEBUG HELPER METHODS================================

function dateline(str) {
  d = new Date();
  return "||" + d.toLocaleString() + "|| " + str + "  ";
}

//&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
//&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
//&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&MONGO&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&

async function initPanels(panelList) {
  _this.log(_this.prefix.function, "Loading server-side panel files...", true);
  for (var i in panelList) { //todo rewrite into foreach
    try {
      var mod = require('./static/main/panels/' + panelList[i] + '/server.js');
      compatEval(mod); //evaluates mod to ensure it has expected functions & files
      mod.init(_this, panelList[i], await mongoDB.collection(panelList[i]));
      _this.log(_this.prefix.function, [panelList[i], " successfully initialized."], true);
      modFunctions[panelList[i]] = mod; //separation allows modFunctions to still work
                                          //on the rest of them even if try/catch is called
      _this.panelsList[panelList[i]] = mod.name;
    } catch (e) { //TODO are there any important errors that should be let through?
      _this.log(_this.prefix.function, [panelList[i], " failed to initialize. error ->"]);
      _this.error(e, true);
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
    _this.log(_this.prefix.function, ["Admin panel not correctly configured, is disabled, or failed to load. Admin actions will not be accessible."], true);
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

//iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii
//iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii
//iiiiiiiiiiiiiiiiiiiiiiii Message Handling iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii

function affirmAndPassOn(message) {
  var messageCollection = [];
  if (modFunctions[message.from.type].signalVisibility(message)) {
    messageCollection[1] = {message: _this.shallowClone(message), emitType: 'allExceptSender'};
    updateState(messageCollection[1].message);
  }
  message.affirm = true;
  messageCollection[0] = {message: message, emitType: 'sender'};
  return messageCollection;
}

//not the most elegant solution...
function setLoadToCreate(message) {
  message.action = "createPanel";
  message.content.loc = _this.getSizeValues(message.content.type, message.content.id);
  if (modFunctions[message.from.type].signalVisibility(message)) {
    return [{message: message, emitType: 'sender'}];
  }
  updateState(message);
  return [{message: message, emitType: 'all'}];
}

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@CURRENT STATE@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

//stateID = type + id

function updateState(message) {
  switch(message.action) {
    case 'createPanel':
      addStateEntry(message);
      break;
    case 'movePanel':
    case 'resizePanel':
      updateStateValues(message);
      break;
    case 'closePanel':
      removeStateEntries(message);
  }
}

function addStateEntry(message) {
  _this.log(_this.prefix.function, ["adding ", message, " to state array."])
  stateObj[message.content.type + message.content.id] = message; //todo remove defaultid stuff
}

function updateStateValues(message) {
  message.appl.forEach((appl) => {
    _this.log(_this.prefix.function, ["updating state values for ", appl]);
    //if more attributes appear, this will have to be revisited, perhaps with deepMerge
    var id = appl.type + appl.id;
    stateObj[id].content.loc = { ...stateObj[id].content.loc, ...message.content.loc };
  });
}

function removeStateEntries(message) {
  message.appl.forEach((appl) => {
    _this.log(_this.prefix.function, ["removing ", appl, " from state array."]);
    delete stateObj[appl.type + appl.id];
  });
}

async function synchronizeState(emit = 'sender', clear = true) {
  var content = [];
  if (clear)
    content.push({action: 'clearTemplate'});
  content.push(await getDatabaseTemplates());
  return [{ message: { action: 'bulk', content: content.concat(Object.values(stateObj)), },
            emitType: emit }];
}

async function saveCurrentTemplate(message) {
  await _this.sharedCollections.stateTemplates.insertOne({obj: stateObj,
                                                          name: message.content.name,
                                                          created: new Date().getTime(),
                                                          _id: new ObjectID().toHexString()});
  var temp = await getDatabaseTemplates(); //todo why can't inline?
  return [{message: temp, emitType: 'all'}];
}

async function loadTemplate(message) {
  stateObj = (await _this.sharedCollections.stateTemplates.findOne({'_id': message.content.id})).obj;
  return synchronizeState('all');
}

async function getDatabaseTemplates(message = {content: {}}) {
  message.action = 'updateTemplateList';
  message.content.infoArray = [];
  var array = await _this.sharedCollections.stateTemplates.find({}).toArray();
  array.forEach((doc) => {
    delete doc.obj; //todo only get id/name/created in initial query, not here
    message.content.infoArray.push(doc);
  });
  return message;
}
