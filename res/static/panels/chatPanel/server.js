var func;
var prefix;
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
  },

  processMessage: function(message, mongo, socket, io) {
    switch(message.action) {
      case 'chatmsg':
        return parseChatMessage(message);
        break;
      case 'init':
        return loadData(message, mongo);
      default:
        return message;
      }
  },
}

function parseChatMessage(message) {
  var str = message.content[0].message;
  var newstr = '';
  var find;
  while ((find = findRegEx(regex.brackets,str)) !== null) {
    newstr += find.first + '[' + recParentheses(find.match) + ']';
    str = find.last;
  }
  message.content[0].message = newstr + str;
  return message;
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

function loadData(message, mongo) {
  return 'TODO'; //TODO
}

function saveData(message, mongo) {

}
