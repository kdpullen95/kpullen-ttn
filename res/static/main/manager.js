var panelArray = [];
var socket = io();

socket.on('upd', function (msg) {
  log(['received message: ', msg]);
  panelArray.forEach(function(panel) {
    panel.putm(msg);
  });
});

function startup() {
  //P
  //get panel list and ids
  //push them all to a panel array (not panel array)
  //let initElement do the rest
}

function sendm(mes) {
  log(['sending message: ', mes]);
  socket.emit('serv', mes);
}

function addPanel(panel, to="panelContainer") {
  log(['adding panel: ', panel]);
  panelArray.push(panel);
  panel.initElement(document.getElementById(to));
}

function removePanel() {
  //TODO TODO TODO TODO TODO NO BLOAT/MEMORY LEAK
}

function factoryStartup() {
  addPanel(new Panel("testPanel", '11'));
  addPanel(new Panel("chatPanel", '12'));
  addPanel(new Panel());
}

function startResize(event, element) {
  element.parentElement.panel.resizing(event.clientX, event.clientY);

}

function startDrag(event, element) {
  element.parentElement.parentElement.panel.dragging(event.clientX, event.clientY);
}
