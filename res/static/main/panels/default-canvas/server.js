var func;
var prefix;
var mongoCollection;

module.exports = {
  name: "Canvas Panel", //human readable name

  init: function(parent, folderName, collection) {
    func = parent;
    prefix = func.prefix.function + "  (" + folderName + ")"; //matches log conventions
    mongoCollection = collection; //to save things to database
  },

  processMessage: function(message) {
    switch(message.action) {
      case 'init':
        return loadData(message);
      case 'draw':
      case 'erase':
      case 'update':
        saveData(message);
      default:
        return [{message: message, emitType: 'all'}];
      }
  },

  getSizeValues: function(id) {
    return {width: 400, height: 400, top: 0, left: 100}; //int pixels
  },

  assignID: function() {
    return Math.floor(Math.random() * 10000); //use mongodb objid
  }
}

function loadData(message) {
  return [{message: message, emitType: 'sender'}]; //TODO
}

function saveData(message) {
  //todo //put message data over other message data ie a message of x, y
  //will be put over the object's x, y, rotate, but only replace x, y
}
