var func;
var prefix;
var collection;
var ObjectID = require('mongodb').ObjectID;

module.exports = {
  name: "Canvas Panel", //human readable name

  init: function(parent, folderName, mongoCollection) {
    func = parent;
    prefix = func.prefix.function + "  (" + folderName + ")"; //matches log conventions
    collection = mongoCollection; //to save things to database
  },

  processMessage: function(message) {
    switch(message.action) {
      case 'init':
        return loadData(message);
      case 'create':
      case 'delete':
      case 'update':
        saveData(message);
      default:
        return [{message: message, emitType: 'allExceptSender'}];
      }
  },

  getSizeValues: function(id) {
    return {width: 500, height: 500, top: 100, left: 100}; //int pixels
  },

  assignID: function() {
    return new ObjectID().toHexString();
  },

  signalVisibility: function(message) {
    return true;
  },

  getSavedPanels: async function(message) {
    var pairArray = [];
    var array = await collection.find({}).toArray(); //todo query only specific fields ffs
    array.forEach((doc) => {
      pairArray.push([doc._id, doc._id]); //no human readable names atm
    });
    return pairArray;
  },

  request: function(message) {
    return null;
  }

}

async function loadData(message) {
  var doc = await collection.findOne({'_id': message.from.id});
  var messageArray = [{message: message, emitType: 'sender'}];
  if (doc == null) return messageArray;
  //if found, return messages will be object arrays of all non _id fields, one message per array/canvas
  var keyArray = Object.keys(doc);
  for (var i = 0; i < keyArray.length; i++) {
    if (keyArray[i] !== '_id') {
      messageArray.push({
        message: { action: 'create', appl: message.appl, content: { objects: JSON.stringify(doc[keyArray[i]]), to: keyArray[i] } },
        emitType: 'sender',
      });
    }
  }
  return messageArray;
}

async function saveData(message) {
  var objects = message.content.objects ? JSON.parse(message.content.objects) : [message.content.object];
  //accounts for delete, which is a singular object that does not need parsing
  for (var i = 0; i < objects.length; i++) { //TODO allow it to appl, not from
    await databaseRemove(objects[i], message.from.id, message.content.to);
    if (message.action != 'delete')
      databaseAdd(objects[i], message.from.id, message.content.to);
  }
}

async function databaseRemove(object, panelID, canvasID) {
  var pullObj = {};
  pullObj[canvasID] = { id: object.id }; //todo find better way to do this?
  collection.updateOne( {'_id': panelID},
                        { '$pull': pullObj},
                        {upsert: false},
                        () => {} );
}

function databaseAdd(object, panelID, canvasID) {
  var pushObj = {};
  pushObj[canvasID] = object; //todo find better way to do this?
  collection.updateOne( {'_id': panelID},
                        {'$push': pushObj},
                        {upsert: true},
                        () => {}  );
}
