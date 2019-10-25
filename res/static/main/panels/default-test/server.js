module.exports = {
  name: "Test Panel",

  init: function(manager) {

  },

  processMessage: function(message) {
    return [{message: message, emitType: 'all'}];
  },

  getSizeValues: function(id) { //TODO
    return {width: 400, height: 400, top: 0, left: 0}; //int pixels
  },

  assignID: function() { //TODO
    return Math.floor(Math.random() * 10000);
  }

}
