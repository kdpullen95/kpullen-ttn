var func;
var prefix;
var idcycle = 1;

module.exports = {
  name: "Launch Panel", //human readable name

  init: function(parent, folderName, collection) {
    func = parent; //access shared functions, like "log", and values like panelsList
    prefix = func.prefix.function + "  (" + folderName + ")"; //matches log conventions
  },

  processMessage: async function(message) {
    if (message.action === "init") {
      message.content = {};
      message.content.panels = func.panelsList;
      message.content.databasePanels = await func.getSavedPanels(message);
    }
    return [{message: message, emitType: 'sender'}];
  },

  getSizeValues: function(id) { //no database data means always default size
    return {width: 300, height: 200, top: 50, left: 50};
  },

  assignID: function() {
    return idcycle++; //todo maybe less lazy
    //but since nothing gets saved to the database with this panel
    //which means all of them get destroyed on server restart anyway...
  },

  signalVisibility: function(message) {
    return false;
  },

  getSavedPanels: function(message) {
    return [];
  },

  request: function(message) {
    return null;
  }
}
