var func;
var prefix;

module.exports = {
  name: "Launch Panel",

  init: function(parent, folderName) {
    func = parent; //access shared functions, like "log"
    prefix = func.prefix.function + "  (" + folderName + ")"; //matches log conventions
  },

  processMessage: function(message, mongo, socket, io) {
    if (message.action === "init") {
      Object.keys(func.modFunctions).forEach(function (key) {
        panelList.push([key, func.modFunctions[key].name]);
      });
      func.log(prefix, ["Launch Panel panelList created: ", panelList]);
    }
    return messsage;
  },
}
