var panelArray = [];
var socket = io();
var defaultIDNum = 1;

socket.on('res', function (msg) {
  log(['received message: ', msg]);
  if (msg.action === 'createPanel') {
    addPanel(new Panel(msg.content.type, msg.content.id), false);
  } else {
    panelArray.forEach(function(panel) {
      panel.passMessageOn(msg);
    });
  }
});

function startup() {
  //P
  //get panel list and ids
  //push them all to a panel array (not panel array)
  //let initElement do the rest
}

function sendMessageToServer(mes) {
  log(['sending message: ', mes]);
  socket.emit('serv', mes);
}

function getDefaultID() {
  return "DEFAULTID" + defaultIDNum++;
}

function addPanel(panel, signal) {
  log(['adding panel: ', panel]);
  panelArray.push(panel);
  panel.initElement(document.getElementById("panelContainer"), signal);
}

function removePanel() {
  //TODO TODO TODO TODO TODO NO BLOAT/MEMORY LEAK
}

function factoryStartup() {
  addPanel(new Panel(), false);
  addPanel(new Panel(), false);
}

function startResize(event, element) {
  element.parentElement.panel.resizing(event.clientX, event.clientY);

}

function startDrag(event, element) {
  element.parentElement.parentElement.panel.dragging(event.clientX, event.clientY);
}
