var func;
var prefix;
var collection;
const ObjectID = require('mongodb').ObjectID;
const fs = require('fs');
var sheetTypes = [];

module.exports = {
  name: "Character Sheet",

  init: function(parent, folderName, mongoCollection) {
    func = parent;
    prefix = func.prefix.function + "  (" + folderName + ")";
    collection = mongoCollection;
    sheetTypes = fs.readdirSync(__dirname + "/sheetTemplates/");
  },

  processMessage: async function(message) {
    switch (message.action) {
      case 'init':
        return await loadSavedSheets(message);
      case 'initSheet':
        return await initSheet(message);
      case 'updSheet':
        updateSheet(message); //todo send affirm eventually
      case 'deleteSheet':
        deleteSheet(message);
    }
    return [{message: message, emitType: 'all'}];
  },

  getSizeValues: function(id) {
    return {width: 400, height: 400, top: 100, left: 100}; //int pixels
  },

  assignID: function() {
    return new ObjectID().toHexString();
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

async function loadSavedSheets(message) {
  message.content = {sheetArray: []};
  var array = await collection.find({}).toArray();
  sheetTypes.forEach((type) => {
    message.content.sheetArray.push({value: 'new', type: type, label: 'New Sheet'})
  });
  array.forEach((doc) => {
    message.content.sheetArray.push({value: doc._id, label: doc._name, type: doc._type, created: doc._created});
  });
  return [{message: message, emitType: 'sender'}];

}

async function initSheet(message) {
  var id = message.content.charID;
  if (id == "new") {
    id = await insertNew(message.content);
  }
  var type = message.content.type;
  message.content = await loadCharacterData(id);
  message.content._html = loadSheetTemplate(type);
  return [{message: message, emitType: 'sender'}];
}

async function loadCharacterData(id) {
  return await collection.findOne({'_id': id});
}

function loadSheetTemplate(type) {
  return fs.readFileSync(__dirname + "/sheetTemplates/" + type, "utf8");
}

async function insertNew(content) {
  var id = module.exports.assignID();
  await collection.insertOne( {'_id': id, '_type': content.type, '_name': content.name, '_created': new Date().getTime()},
                              () => {} );
  return id;
}

function updSheet(message) {
  var insert = {};
  insert[message.content.fieldName] = message.content.value;
  //todo support multiple fields being updated at once?
  collection.updateOne( {'_id': message.content.charID},
                        insert,
                        () => {}  );
}

function deleteSheet(message) {
  collection.deleteOne( {'_id': message.content.charID},
                        () => {} );
}
