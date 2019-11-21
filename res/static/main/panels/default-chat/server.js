var func;
var prefix;
var collection;
var ObjectID = require('mongodb').ObjectID;

//(((((((((((((((((((((((((((((((((((((())))))))))))))))))))))))))))))))))))))
//((((((((((((((((((((RegEx Expressions (for parsing))))))))))))))))))))))))))
var regex = {
  brackets:       /\[([^\[\]]+)\]/,                  //finds interior brackets
  parentheses:    /\(([^\(\)]+)\)/,                  //finds interior parentheses
  addSubtract:    /-?\d+(\[.+\])?\s*(\+|-)\s*-?\d+(\[.+\])?/,     //whitespace & brackets friendly add & subtract
  multiplyDivide: /-?\d+(\[.+\])?\s*(\*|\/)\s*-?\d+(\[.+\])?/,    //... multiply & divide
  exponent:       /-?\d+(\[.+\])?\s*\^\s*-?\d+(\[.+\])?/,         //... exponent
  roll:           /-?\d+(\[.+\])?d-?\d+(\[.+\])?/,                //rolls dice, #d# format, no space
  convert:        0,                           //converts between imperial/metric TODO
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
    return {width: 400, height: 400, top: 100, left: 100}; //int pixels
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

function parseChatMessage(message) {
  var str = message.content.message;
  var newstr = '';
  var find;
  while ((find = findRegEx(regex.brackets,str)) !== null) {
    newstr += find.first + '[' + recParentheses(find.matchTrimmed) + ']';
    str = find.last;
  }
  message.content.user = message.user.name;
  message.content.message = newstr + str;
  saveData(message);
  var affirm = func.shallowClone(message);
  affirm.action = "affirm";
  return [{message: affirm, emitType: 'sender'}, {message: message, emitType: 'allExceptSender'}];
}

function recParentheses(str) {
  var find;
  while ((find = findRegEx(regex.parentheses,str)) !== null) {
    str = find.first + recParentheses(find.matchTrimmed) + find.last;
  }
  return mathSearch(str);
}

//TODO - do this better by either figuring out how to ignore things within brackets, or...
//TODO parseInt is not picking up numbers that also have brackets in the string, like 25[5*5]. Substring at first bracket?
//format 45[something] denotes num answer first, steps that got there second
//PREMDAS
//roll - exponent - (multiply - divide) - (add - subtract)
function mathSearch(str) {
  var find;
  //////////////////////ROLL////////////////////////////////////////////////////
  while((find = findRegEx(regex.roll, str)) !== null) {
    var nums = extractNums(find.match.split("d"));
    var rollStr = '';
    var total = 0;
    for (var i = 0; i < nums[0]; i++) {
      var n = Math.floor(Math.random() * nums[1]) + 1;
      total += n;
      rollStr += n + " ";
    }
    str = find.first;
    //str += total + '[R ' + rollStr + ']';
    str += total + '[R ' + rollStr + '[' + find.match.replace(/d/, "$r$") + ']]'
    str += find.last;
  }

  //////////////////EXPONENT////////////////////////////////////////////////////
  while((find = findRegEx(regex.exponent, str)) !== null) {
    var nums = extractNums(find.match.split("^"));
    str = find.first;
    str += Math.pow(nums[0], nums[1]) + '[' + find.match.replace(/\^/, "$e$") + ']';
    str += find.last;
  }

  ///////////////MULTIPLY/DIVIDE////////////////////////////////////////////////
  while((find = findRegEx(regex.multiplyDivide, str)) !== null) {
    str = find.first;
    if (find.match.indexOf("*") > find.match.indexOf("/")) {
      var nums = extractNums(find.match.split("*"));
      str += (nums[0]*nums[1]) + '[' + find.match.replace(/\*/, "$m$") + ']';
    } else {
      var nums = extractNums(find.match.split("/"));
      str += (nums[0]/nums[1]) + '[' + find.match.replace(/\//, "$d$") + ']';
    }
    str += find.last;
  }
  return str;
  //TODO this needs more attention since - can be negative (beginning)
  //TODO i n f i n i t e l o o p
  ///////////////ADD/SUBTRACT///////////////////////////////////////////////////
  var li = 0;
  while((find = findRegEx(regex.addSubtract, str)) !== null && li < 5) {
    str = find.first;
    var indexSubtract = find.match.indexOf("-", 1);
    var indexAdd = find.match.indexOf("+");
    if (indexAdd > 0 && indexAdd < indexSubtract) {
      var nums = extractNums(find.match.split("+"));
      str += (nums[0] + nums[1]) + '[' + find.match.replace(/\+/, "$a$") + ']';
    } else {
      var nums = extractNums(find.match.split("-"));
      str += (nums[0] - nums[1]) + '[' + find.match.replace(/-/, "$s$") + ']';
    }
    str += find.last;
    li++;
  }

  return str;
}

function extractNums(nums) {
  console.log(nums);
  for (var i = 0; i < nums.length; i++) {
    nums[i] = parseInt(nums[i], 10);
  }
  console.log(nums);
  return nums;
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
    match: res[0],
    matchTrimmed: res[1],
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
  if (doc !== null) {
    message.content = doc.messages;
  }
  return [{ message: message, emitType: 'sender'}];
}
