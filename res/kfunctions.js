var verbose = false;
var objExpand = false;
var funcVerbose = false;
var modFunctions = {};

//****************************************************************************

module.exports = {

  modFunctions: {},

  init: function(panelList) {
    this.log(this.prefix.function, "Loading server-side panel files...", true);
    for (var i in panelList) {
      this.modFunctions[panelList[i]] = require('./static/panels/' + panelList[i] + '/server.js');
      this.modFunctions[panelList[i]].init(this, panelList[i]);
      this.log(this.prefix.function, panelList[i] + " successfully initialized.", true);
    }
  },

  prefix:  {
    socket:         '>>>>>>SOCKET.io>>>>>>>',
    mongo:          '######MONGOdb#########',
    express:        '******EXPRESSjs*******',
    default:        '------DEFAULTmsg------',
    function:       '%%%%%%kfunctions%%%%%%',
  },

  //****************************************************************************
  //****************************************************************************
  //*********************MESSAGE PROCESSING & RESPONSE**************************

  processMessage: function(message, mongo, socket, io) {
    if (message.from && message.from.type) {
      if (message.action && message.action === 'initPanel') {
        this.createPanel(message);
      } else
      if (this.modFunctions[message.from.type]) {
        message = this.modFunctions[message.from.type].processMessage(message, mongo, socket, io);
      }
    }
    return message;
  },

  //&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
  //&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
  //&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&MONGO&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&

  //TODO actual assignment of proper values, not random
  createPanel: function(message) {
    message.content = {};
    message.content.id = message.from.id == '0' ? this.assignID() : message.from.id;
    message.content.loc = this.getSizeValues(message.content.id);
    message.content.type = message.from.type;
    return message;
  },

  //TODO
  assignID: function() {
    return Math.floor(Math.random() * 10000);
  },

  //TODO
  getSizeValues: function(id) {
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
