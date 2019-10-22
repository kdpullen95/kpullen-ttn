var func;
var prefix;

module.exports = {
  name: "Launch Panel",

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
    return message;
  },
}
