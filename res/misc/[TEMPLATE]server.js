//ALL internal variables are optional: can pass interface check with only the
//functions and variable listed in module.exports, provided they return the right format

var func;
var prefix;
var mongoCollection;

module.exports = {
  name: "Launch Panel", //human readable name

  init: function(parent, folderName, collection) {
    func = parent; //access shared functions, like "log", and values like panelsList
    prefix = func.prefix.function + "  (" + folderName + ")"; //matches log conventions
    mongoCollection = collection; //to save things to database in your panel's private collection
  },

  processMessage: function(message) {
    if (message.action === "init") {
      //do things here, maybe
    }
    return message;
  },

  getSizeValues: function(id) { //no database data means always default size
    //if database check, put it here and update size values accordingly
    return {width: INT, height: INT, top: INT, left: INT}; //int pixels
  },

  assignID: function() {
    //put database call to ensure unique ids if you need to here
    return id; //literally whatever, as long as it's not so long it starts causing issues
  }
}
