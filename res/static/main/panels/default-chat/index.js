var panel;

function init(panel, themeURL) {
  this.panel = panel;
  this.panel.assignChild(this);
  this.chatBox = document.getElementById("chatBox");
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
  var div = createMessageAndPopout(chatmsg);
  if (pending) {
    div.classList.add('pendingMessage');
    div.id = chatmsg.time;
  }
  div.onmouseup = function(ev) {
    var ele = ev.toElement;
    if (ele.display) {
      ele.querySelector('.pop').style.display = "none";
    } else {
      ele.querySelector('.pop').style.display = "block";
    }
    ele.display = !ele.display;
  }
  div.display = false;
  div.appendChild(document.createElement("HR"));
  this.chatBox.appendChild(div);
  //var condiv = document.getElementById("chat");
  //condiv.scrollTop = condiv.scrollHeight;
}

function createMessageAndPopout(chatMessage) {
  var firstIndex = chatMessage.message.indexOf('[') + 1;
  var lastIndex =  chatMessage.message.lastIndexOf(']');
  var mathStr = chatMessage.message.substring(firstIndex, lastIndex);
  var mathExtract = "";
  if (lastIndex - firstIndex > 0) {
    mathExtract = mathStr.substring(0, mathStr.indexOf('['));
  }
  var date = new Date(chatMessage.time);
  //todo replace chatMessage.user with chatMessage.as when as commands are added
  var message = '[' + date.toLocaleTimeString().replace(" AM","").replace(" PM","") + '] ' + chatMessage.user + ': ';
  if (mathExtract.length > 0) {
    message += chatMessage.message.substring(0, firstIndex) + mathExtract + chatMessage.message.substring(lastIndex);
  } else {
    message += chatMessage.message;
  }
  message = document.createTextNode(message);
  var pop = document.createElement("DIV");
  pop.appendChild(document.createTextNode("Time: " + date.toLocaleString()));
  pop.appendChild(document.createElement("BR"));
  pop.appendChild(document.createTextNode("User: " + chatMessage.user));
  pop.appendChild(document.createElement("BR"));
  pop.appendChild(document.createTextNode("Math: " + mathStr));
  pop.classList.add("pop");
  pop.classList.add("bordered");
  pop.style.display = "none";
  var div = document.createElement("DIV");
  div.appendChild(message);
  div.appendChild(pop);
  return div;
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
  chatmsg.user = 'YOU (sending...)'
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
