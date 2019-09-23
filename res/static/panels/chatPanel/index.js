var panel;

function init(panel) {
  this.panel = panel;
  this.panel.assignChild(this);
  this.panel.passm({action: 'init'});
}

function putm(msg) {
  switch(msg.action) {
    case 'chatmsg':
      addChatMessages(msg.content);
      break;
    default:
      break;
  }
}

function addChatMessages(array) {
  for (var c in array) {
    addChatMessage(array[c]);
  }
}

function addChatMessage(chatmsg) {
  var str = '[';
  str += chatmsg.time;
  str += ' ' + chatmsg.user + ']: ';
  str += chatmsg.message;
  var div = document.getElementById("chatBox");
  div.appendChild(document.createTextNode(str));
  div.appendChild(document.createElement("HR"));
}

function sendChatMessage() {
  var chatmsg = {};
  chatmsg.message = document.getElementById("inputBox").value;
  chatmsg.time = new Date().getTime();
  this.panel.passm({action: 'chatmsg', content: [chatmsg], appl:[getID()]});
  sendingSave(chatmsg);
}

function sendingSave(chatmsg) {
  //TODO save the message temporary redtext
  //TODO confirm that message was printed
  document.getElementById("inputBox").value = '';
}

function chatEnterCheck(e) {
    var code = (e.keyCode ? e.keyCode : e.which);
    if (code == 13) { //Enter keycode
        sendChatMessage();
    }
}

//grabs ID from panel
function getID() {
  return this.panel.getID();
}
