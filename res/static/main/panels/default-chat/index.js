var panel;

function init(panel, themeURL) {
  this.panel = panel;
  this.panel.assignChild(this);
  setTheme(themeURL); //todo figure out why first request receives wrong MIME, then delete
  setTheme(themeURL);
  this.panel.buildMessageAndSend('init');
}

function passMessageOn(message) {
  switch(message.action) {
    case 'affirm':
      removePending(message.content);
    case 'chatmsg':
      addChatMessage(message.content);
      break;
    case 'init':
      addChatMessages(message.content);
      break;
    default:
  }
}

function removePending(message) {
  var message = document.getElementById(message.time);
  message.parentNode.removeChild(message);
}

function addChatMessages(array) {
  for (var c in array) {
    addChatMessage(array[c]);
  }
}

function addChatMessage(chatmsg, pending=false) {
  //TODO options for displaying things
  var str = '';
  var date = new Date(chatmsg.time);
  str += '[' + date.toLocaleTimeString().replace(" AM","").replace(" PM","") + '] ';
  str += chatmsg.user + ': ';
  str += chatmsg.message;
  var div = document.createElement("DIV");
  document.getElementById("chatBox").appendChild(div);
  if (pending) {
    div.classList.add('pendingMessage');
    div.id = chatmsg.time;
  }
  var node = document.createTextNode(str);
  var hoverInfo = date.toLocaleString() + "\nUser: " + chatmsg.user;
  //todo make this a proper popout, not a hover title
  div.setAttribute("title", hoverInfo);
  div.appendChild(node);
  div.appendChild(document.createElement("HR"));
  // var condiv = document.getElementById("chat");
  // condiv.scrollTop = condiv.scrollHeight;
}

function sendChatMessage() {
  var chatmsg = {};
  chatmsg.message = document.getElementById("inputBox").value;
  if (chatmsg.message == "") return;
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

function setTheme(url) {
  document.getElementById("themeCSS").href = url;
}
