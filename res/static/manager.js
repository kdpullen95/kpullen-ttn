var panelArray = [];
var socket = io();

socket.on('upd', function (msg) {
  log(msg);
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
  log(mes);
  socket.emit('serv', mes);
}

function factoryStartup() {
  arr = [];
  arr.push(new Panel("testPanel", '10'));
  arr.push(new Panel("testPanel", '11'));
  arr.push(new Panel("chatPanel", '12'));
  arr.push(new Panel());
  arr.push(new Panel());
  addPanels(arr, "panelContainer");
}

function addPanels(pArr, to) {
  var container = document.getElementById(to);
  pArr.forEach(function(panel) {
    log(panel);
    panelArray.push(panel);
    panel.initElement();
    container.appendChild(panel.element);
  });
}
