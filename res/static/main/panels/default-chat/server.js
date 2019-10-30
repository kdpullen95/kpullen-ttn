var func;
var prefix;
var collection;
var ObjectID = require('mongodb').ObjectID;

//(((((((((((((((((((((((((((((((((((((())))))))))))))))))))))))))))))))))))))
//((((((((((((((((((((RegEx Expressions (for parsing))))))))))))))))))))))))))
var regex = {
  brackets: /\[([^\[\]]+)\]/,             //finds interior brackets
  parentheses: /\(([^\(\)]+)\)/,          //finds interior parentheses
  add: /\d+(\[.+\])?\s*\+\s*\d+/,         //whitespace & brackets friendly add
  divide: /\d+(\[.+\])?\s*\/\s*\d+/,                            //... divide
  subtract: /\d+(\[.+\])?\s*-\s*\d+/,                           //... subtract
  exponent: /\d+(\[.+\])?\s*\^\s*\d+/,                          //... exponent
  multiply: /\d+(\[.+\])?\s*\*\s*\d+/,                          //... multiply
  roll: /\d+(\[.+\])?d\d+/,              //rolls dice, #d# format, no space
  convert: 0,                         //converts between imperial/metri TODOc
}


module.exports = {
  name: "Chat Panel",

  init: function(parent, folderName, mongoCollection) {
    func = parent;
    prefix = func.prefix.function + "  (" + folderName + ")";
    collection = mongoCollection;
  },

  //messageCollection = [{message: messageObject, emitType: string}, {mess...ring}]
  ////emit types: sender, all, allExceptSender
  processMessage: async function(message) {
    switch(message.action) {
      case 'chatmsg':
        return parseChatMessage(message);
      case 'init':
        return await loadData(message);
      default: //todo remove?
        return [{message: message, emitType: 'all'}];
      }
  },

  getSizeValues: function(id) { //TODO
    return {width: 400, height: 400, top: 0, left: 0}; //int pixels
  },

  assignID: function() { //TODO
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
  }
}

function parseChatMessage(message) {
  var str = message.content.message;
  var newstr = '';
  var find;
  while ((find = findRegEx(regex.brackets,str)) !== null) {
    newstr += find.first + '[' + recParentheses(find.match) + ']';
    str = find.last;
  }
  message.content.message = newstr + str;
  saveData(message);
  var affirm = func.shallowClone(message);
  affirm.action = "affirm";
  return [{message: affirm, emitType: 'sender'}, {message: message, emitType: 'allExceptSender'}];
}

function recParentheses(str) {
  var find;
  while ((find = findRegEx(regex.parentheses,str)) !== null) {
    str = find.first + recParentheses(find.match) + find.last;
  }
  return buildMath(str);
}

//format 45[something] denotes num answer first, steps that got there second
//PREMDAS
function buildMath(str) {
  var num = 0;
  return num + '[' + str + ']';
}

// splits the str nicely when given regex
function findRegEx(reg, str) {
  func.log(prefix, ['testing ', str, ' for ', reg.toString()]);
  var res = reg.exec(str);
  if (res === null) {
    return null;
  }
  func.log(prefix, [reg.toString(), ' match found: ', res[0]]);
  return {
    first: str.substring(0, res.index),
    match: res[1],
    last: str.substring(res.index + res[0].length)
  };
}

//informal schema { id: 0, messages: [], startDate: 0, endDate: 0 } ?
function saveData(message) {
  collection.updateOne( {'_id': message.from.id},
                        {'$push': {'messages': message.content}},
                        {upsert: true},
                        () => {}  );
}

async function loadData(message) {
  var doc = await collection.findOne({'_id': message.from.id});
  message.content = doc.messages;
  return [{ message: message, emitType: 'sender'}]; //TODO
}
