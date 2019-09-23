var verbose = false;
var objExpand = false;
var funcVerbose = false;
var modFunctions = {};

//****************************************************************************

module.exports = {

  init: function(modList) {
    for (var i in modList) {
      modFunctions[modList[i]] = require('./static/panels/' + modList[i] + '/server.js');
      modFunctions[modList[i]].init(this);
    }
  },

  pref:  {
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
    if (message.action === 'init') {
      if (message.from.id === '0') {
        message = this.createPanel(message);
      }
    } else
    if (message.from && message.from.type && modFunctions[message.from.type]) {
        message = modFunctions[message.from.type].
                                    processMessage(message, mongo, socket, io);
    }
    return message;
  },

  //&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
  //&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
  //&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&MONGO&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&

  createPanel: function(message) {
    if (typeof(message.content) === 'undefined') {
      message.content = {};
    }
    message.content.id = 645;
    message.content.width = 300;
    message.content.height = 300;
    return message;
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

  log: function(pref, strArray, force=false) {
    if ((!verbose && !force) ||
        (!funcVerbose && pref === this.pref.function)) return;
    str = '';
    for (var s in strArray) {
      str += readify(strArray[s]);
    }
    console.log(dateline(pref) + str);
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
