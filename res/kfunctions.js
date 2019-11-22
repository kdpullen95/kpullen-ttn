var verbose = true;
var mongoDB;
const reqFunctions = ["init", "processMessage", "getSizeValues", "assignID", "signalVisibility", "getSavedPanels", "request"]; //TODO move this to a file or something
const sharedCollectionsTxt = ["userSettings", "resources", "charSheets", "stateTemplates"]; //TODO ditto
var modFunctions = {}; //access to specific panels files
var stateObj = {}; //keeps a running record of the current state of panels
var permissionCollection, userCollection; //kfunction-only collections
const ObjectID = require('mongodb').ObjectID; //create IDs!

//****************************************************************************

module.exports = {

  panelsList: {}, //list of panel names

  sharedCollections: {},

  init: async function(panelList, mongoClient, databaseName, adminPanelName, themeList) {
    this.themeList = themeList;
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
      case 'client:synchronize':
        return await synchronizeState();
      case 'template:save':
        return await saveCurrentTemplate(message);
      case 'template:load':
        return await loadTemplate(message);
      case 'panel:load':
        return setLoadToCreate(message);
      case 'panel:create':
        return affirmAndPassOn(this.assignValues(message));
      case 'panel:move':
      case 'panel:resize':
      case 'panel:close':
          return affirmAndPassOn(message);
      default: //todo operate on appl, not from?
        if (modFunctions[message.from.type])
          return await modFunctions[message.from.type].processMessage(message);
    }
  },

  //&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
  //&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
  //&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&MONGO&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&

  //types 1-10 view, 11-20 edit, 21+ control
  //TODO access user collection and checks to see if they have that permission or not, boolean return
  //permissioncodes are in the format of 'type-identifier', where the type is the type of permission
  //and identifier is the subtype, so permission to see things flagged as 'foo' in the database would
  //be chceked via checkPermission(userName, 'resourcePanel-flag:foo') or similar. Permissions can only
  //be set by someone with checkPermission(user, permissionCode) > 20 for a specific code OR by an active
  //panel/server element. Pass "this" as authUser if panel server.js file, those get instant 21 permissions.
  //numerical values so that you can test for view OR ABOVE without trouble
  //numerical values are spread out so that granular permissiosn control can be implemeneted

  getPermissionType: async function (user, permissionCode) {
    this.log(this.prefix.function, ["User ", user," requesting permissions, code: ", permissionCode])
    if (isAdmin(user)) {
      this.log(this.prefix.function, ["Admin permissions request accepted for user ", user]);
      return 50; //a user with admin permissions has control over all permissions, including ones that don't exist yet
    }
    var field = {};
    field[user] = 1;
    var indiv = await permissionCollection.findOne(  {'_id': permissionCode },
                                                      field,
                                                      () => {} );
    if (typeof indiv !== 'undefined') return indiv;
    return await permissionCollection.findOne(  {'_id': permissionCode},
                                                {'s:default': 1},
                                                () => {} );
  },

  /**
   * Sets a permission code to given value, rejects if authUser does not have
   * permission to set that code. By convention, values are:
   * 1-10 view, 11-20 edit, 21+ control
   * @param  {String} authUser       String username OR self for modules
   * @param  {String} user           Target user for set permission, s:default for default
   * @param  {String} permissionCode permission code to set. upsert if doesn't exist
   * @param  {Integer} to             value to set the permission code to
   */
  setPermission: async function (authUser, user, permissionCode, to) {
    if (activeElement(authUser) || await this.getPermissionType(authUser, permissionCode) > 10 ) {
      var field = {};
      field[user] = to;
      permissionCollection.updateOne( {'_id': permissionCode},
                                      field,
                                      {upsert: true},
                                      () => {} );
    } else {
      throw new Error("User " + authUser + " not authorized to set permissions on " + permissionCode);
    }
  },

  /**
   * Returns true if user matches database or admin login
   * @param  {String} user
   * @param  {String} pin
   * @return {Boolean}
   */
  authUser: async function(user, pin) {
    try {
      //BIG TODO (actual security not plaintext pins)
      if (user === "s:admin" && pin === "admin") {
        return true; //todo feature to assign an account admin and just work from there
      }
      return pin === (await userCollection.findOne({'_id': user})).pin;
    } catch (e) {
      //todo add in a check that stops this from being called when users just don't exist?
      this.log(this.prefix.function, [user, " userAuth encountered error when verifying with ", pin, ". user might not exist. error->"]);
      this.error(e);
      return false;
    }
  },

  //todo can this be moved out of exports?
  assignValues: function(message) {
    message.content = { id: message.from.id.toString().startsWith('DEFAULTID') ? this.assignID(message.from.type) : message.from.id,
                        type: message.from.type };
    message.content.loc = this.getSizeValues(message.from.type, message.content.id);
    return message;
  },

  /**
   * Queries panel server module for ID usable for panel
   * @param  {String} type panel type name
   * @return {String}   may be of non-string type if module implements
   */
  assignID: function(type) {
    return modFunctions[type].assignID();
  },

  /**
   * Queries panel server module and returns what size a new or loaded panel should
   * be instantiated with.
   * @param  {String} type panel type name
   * @param  {String} id   panel id string
   * @return {Object}      {width: int, height: int, top: int, left: int}
   */
  getSizeValues: function(type, id) {
    return modFunctions[type].getSizeValues(id);
  },

  /**
   * Returns a list of saved panels for the specified message, for every type of
   * panel (iterates through panelsList)
   * @param  {Object} message message prompting the loading of panels
   * @return {Object} (key, value) = (panelName, array of saved Panels). Arrays
   *                                                            can be empty
   */
  getSavedPanels: async function(message) {
    var co = {};
    var keyArray = Object.keys(this.panelsList);
    for (var i = 0; i < keyArray.length; i++) {
      co[keyArray[i]] = await modFunctions[keyArray[i]].getSavedPanels(message);
    }
    return co;
  },

  //============================================================================
  //============================================================================
  //========================DEBUG & HELPER METHODS==============================

  /**
   * Shallow clones the provided object using object.assign
   * @param  {Object} obj Object to clone
   * @return {Object}     Cloned object
   */
  shallowClone: function(obj) {
    return Object.assign({}, obj);
  },

  deepClone: function(obj) {
    return 'TODO'; //TODO
  },

  setVerbose: function(v) {
    verbose = v;
  },

  /**
   * Prints to console with expanded objects via JSON.stringify and time/date
   * @param  {String}  prefix       string to use as prefix, see this.prefix
   * @param  {Array}  strArray      array of strings and objects to expand, concat, and print
   * @param  {Boolean} [force=false] forces output even if verbose is false
   */
  log: function(prefix, strArray, force=false) {
    if (!verbose && !force) return;
    str = '';
    for (var s in strArray) {
      str += typeof strArray[s] === 'object' ? JSON.stringify(strArray[s]) : strArray[s];
    }
    console.log(dateline(prefix) + str);
  },
  /**
   * Prints error and stacktrace.
   * @param  {Object}  error        error object
   * @param  {Boolean} [stack=true] whether to print stack trace or not
   * @param  {Boolean} [exit=false] whether to exit or not (not working currently todo)
   */
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

function activeElement(authUser) {
  return true; //todo
}

async function initPanels(panelList) {
  _this.log(_this.prefix.function, "Loading server-side panel files...", true);
  for (var i in panelList) { //todo rewrite into foreach
    try {
      var mod = require('./static/main/panels/' + panelList[i] + '/server.js');
      compatEval(mod); //evaluates mod to ensure it has expected functions & files
      mod.init(_this, panelList[i], await mongoDB.collection(panelList[i]));
      _this.log(_this.prefix.function, [panelList[i], " successfully initialized."], true);
      if (typeof mod.getDefaultPermissions === 'function') {
        insertDefaultPermissions(mod.getDefaultPermissions());
      }
      modFunctions[panelList[i]] = mod; //separation allows modFunctions to still work
                                          //on the rest of them even if try/catch is called
      _this.panelsList[panelList[i]] = mod.name;
    } catch (e) { //TODO are there any important errors that should be let through?
      _this.log(_this.prefix.function, [panelList[i], " failed to initialize. error ->"]);
      _this.error(e, true);
    }
  }
}

function insertDefaultPermissions(permissions) {
  permissions.forEach( (permission) => {
    permissionCollection.updateOne( {'_id': permission.code },
                                    { $setOnInsert: { 's:default': permission.value } },
                                    { upsert: true } );
  });
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
  permissionCollection = await mongoDB.collection("permissions");
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

function isAdmin(user) {
  return user === "s:admin"; //todo come back and make this respond to any username
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
  message.action = "panel:create";
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
    case 'panel:create':
      addStateEntry(message);
      break;
    case 'panel:move':
    case 'panel:resize':
      updateStateValues(message);
      break;
    case 'panel:close':
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
    content.push({action: 'template:clear'});
  content.push({action: 'theme:updateList', content: {themeArray: _this.themeList, default: 'light.css'}}); //todo move to first time connection sync if implemeneted
  content.push(await getDatabaseTemplates());
  return [{ message: { action: 'client:bulk', content: content.concat(Object.values(stateObj)), },
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
  message.action = 'template:updateList';
  message.content.infoArray = [];
  var array = await _this.sharedCollections.stateTemplates.find({}).toArray();
  array.forEach((doc) => {
    delete doc.obj; //todo only get id/name/created in initial query, not here
    message.content.infoArray.push(doc);
  });
  return message;
}
