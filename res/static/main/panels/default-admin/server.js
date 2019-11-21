var func;
var prefix;
var collection;
var userCollection;

module.exports = {
  name: "Admin Panel", //human readable name

  init: function(parent, folderName, mongoCollection) {
    func = parent;
    prefix = func.prefix.function + "  (" + folderName + ")";
    collection = mongoCollection;
  },

  processMessage: async function(message) {
    switch (message.action) {
      case "sync":
      case "init":
        return await loadData(message);
      case "createUser":
        return await createUser(message);
      case "deleteUser":
        return await deleteUser(message);
    }
    return [];
  },

  getSizeValues: function(id) { //no database data means always default size
    return {width: 400, height: 400, top: 100, left: 100};
  },

  assignID: function() {
    return Math.floor(Math.random() * 1000000);
  },

  signalVisibility: function(message) {
    return false;
  },

  getSavedPanels: function(message) {
    return [];
  },

  request: function(message) {
    return null;
  },

  setUserCollection: function(collection) {
    userCollection = collection;
  }
}

async function createUser (message) {
  if ((await func.getPermissionType(message.user.name, 'function:userManagement')) > 10) {
    userCollection.insertOne({_id: message.content.user, pin: Math.floor(Math.random() * 1000).toString()}, () => {});
  }
  message.affirm = true;
  return [{message: message, emitType: 'sender'}];
}

async function deleteUser (message) {
  if ((await func.getPermissionType(message.user.name, 'function:userManagement')) > 20) {
    userCollection.deleteOne({_id: message.content.user}, () => {});
  }
  message.affirm = true;
  return [{message: message, emitType: 'sender'}];
}

async function loadData (message) {
  message.content = {};
  if ((await func.getPermissionType(message.user.name, 'function:userManagement')) > 0) {
    message.content.users = await userCollection.find({}).toArray();
  }
  return [{message: message, emitType: 'sender'}];
}
