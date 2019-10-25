var func;
var prefix;
var idcycle = 1;

module.exports = {
  name: "Launch Panel", //human readable name

  init: function(parent, folderName, collection) {
    func = parent; //access shared functions, like "log", and values like panelsList
    prefix = func.prefix.function + "  (" + folderName + ")"; //matches log conventions
  },

  processMessage: function(message) {
    if (message.action === "init") {
      var panelList = [];
      Object.keys(func.panelsList).forEach(function (key) {
        panelList.push([key, func.panelsList[key]]);
      });
      message.content = panelList;
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
  }
}
