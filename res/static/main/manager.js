var panelObj = {};
var socket = io();
var defaultIDNum = 1;

socket.on('res', function (msg) {
  log(['received message: ', msg]);
  processMessage(msg);
});

function processMessage(msg) {
  if (msg.action === 'createPanel' && !msg.affirm) {
    addPanel(new Panel(msg.content.type, msg.content.id), msg.content);
  } else if (msg.action === 'closePanel' && !msg.affirm) {
    removePanels(msg.appl);
  } else if (msg.action === 'bulk') {
    msg.content.forEach( (message) => {
      processMessage(message);
    });
  } else { //todo more elegant id-based solution to this
    Object.values(panelObj).forEach(function(panel) {
      panel.passMessageOn(msg);
    });
  }
}

function synchronizationRequest() {
  sendMessageToServer({action: "synchronize", from: {type: 'manager'}});
}

function clear() {

}

function startup() {
  clear();
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

function addPanel(panel, content) {
  log(['adding panel: ', panel]);
  panelObj[panel.getStrID()] = panel;
  panel.initElement(document.getElementById("panelContainer"), content);
}

function addNewPanel() { //
  addPanel(new Panel());
}

function removePanels(applArray) {
  applArray.forEach( (appl) => {
    panelObj[appl.type + appl.id].delete();
  });
}

function removePanel(panel) {
  delete panelObj[panel.getStrID()];
}

function updatePanelID(oldStrID, panel) {
  delete panelObj[oldStrID];
  panelObj[panel.getStrID()] = panel;
}

function startResize(event, element) {
  element.parentElement.panel.resizing(event.clientX, event.clientY);

}

function startDrag(event, element) {
  element.parentElement.parentElement.panel.dragging(event.clientX, event.clientY);
}

function closePanel(event, element) {
  element.parentElement.panel.deleteSignal();
}
