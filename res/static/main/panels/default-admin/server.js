var func;
var prefix;
var collection;

module.exports = {
  name: "Launch Panel", //human readable name

  init: function(parent, folderName, mongoCollection) {
    func = parent; //access shared functions, like "log", and values like panelsList
    prefix = func.prefix.function + "  (" + folderName + ")"; //matches log conventions
    collection = mongoCollection; //to save things to database in your panel's private collection
  },

  processMessage: function(message) {
    //called when a message with your type in the appl array is sent.
    //this message may not necessarily originate from a panel of your type, it
    //may be a request from a different panel type for response. In that case,
    //you will need to update [appl] accordingly with who sent the message, if
    //you want to respond.
    switch (message.action) {
      case "init":
      //do things here or add new cases as needed
      default:
    }
    return message;
  },

  getSizeValues: function(id) { //no database data means always default size
    //if database check, put it here and update size values accordingly
    return {width: INT, height: INT, top: INT, left: INT}; //int pixels
  },

  assignID: function() {
    return id; //literally whatever, as long as it's not so long it starts causing issues
    //recommend, if using database, using mongodb's ObjectID().toHexString (see default-chat & default-canvas)
  },

  signalVisibility: function(message) {
    //determines default propagation of messages: visibility false makes it so that no
    //changes/loading of panels on a user's side are sent to other users, making the panels
    //opened "private" (like the character sheet and launch panels).
    //Message passed in so that situational visibility can be implemented.
    return true;
  },

  getSavedPanels: function(message) {
    return []; //or array of [human readable name, id] pairs if saved panels exist
  },

  request: function(message) {
    //allows intercommunication between different panels' server.js files server-side,
    //such as requests for info or changes to internal state of a panel next time it gets updated
    //just return null if no implementation
    return null;
  }
}
