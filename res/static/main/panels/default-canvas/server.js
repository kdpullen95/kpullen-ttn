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
      default:
        return message;
      }
  },

  getSizeValues: function(id) {
    return {width: 400, height: 400, top: 0, left: 100}; //int pixels
  },

  assignID: function() {
    return Math.floor(Math.random() * 10000);
  }
}

function loadData(message) {
  return 'TODO'; //todo
}
