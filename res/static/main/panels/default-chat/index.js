var panel;

function init(panel) {
  this.panel = panel;
  this.panel.assignChild(this);
  this.panel.buildMessageAndSend('init');
}

function passMessageOn(msg) {
  switch(msg.action) {
    case 'affirm':
      removePending(msg.content);
    case 'chatmsg':
      addChatMessage(msg.content);
      break;
    case 'init':
      addChatMessages(msg.content);
      break;
    default:
  }
}

function removePending(chatmsg) {
  var message = document.getElementById(chatmsg.time);
  message.parentNode.removeChild(message);
}

function addChatMessages(array) {
  for (var c in array) {
    addChatMessage(array[c]);
  }
}

function addChatMessage(chatmsg, pending=false) {
  //TODO options for displaying things
  var str = '[';
  str += chatmsg.time;
  str += ' ' + chatmsg.user + ']: ';
  str += chatmsg.message;
  var div = document.createElement("DIV");
  document.getElementById("chatBox").appendChild(div);
  if (pending) {
    div.classList.add('pendingMessage');
    div.id = chatmsg.time;
  }
  var node = document.createTextNode(str);
  div.appendChild(node);
  div.appendChild(document.createElement("HR"));
}

function sendChatMessage() {
  var chatmsg = {};
  chatmsg.message = document.getElementById("inputBox").value;
  chatmsg.time = new Date().getTime();
  //todo figure out how to skip/pass values by equality?
  this.panel.buildMessageAndSend('chatmsg', [this.panel.getIdentification()], chatmsg);
  sendingSave(chatmsg);
}

function sendingSave(chatmsg) {
  addChatMessage(chatmsg, true);
  document.getElementById("inputBox").value = '';
}

function chatEnterCheck(e) {
    var code = (e.keyCode ? e.keyCode : e.which);
    if (code == 13) { //Enter keycode
        sendChatMessage();
    }
}
