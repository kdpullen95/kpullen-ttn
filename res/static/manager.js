var panelArray = [];
var urlLoc = "/";
var socket = io();

socket.on('upd', function (msg) {
  log(msg);
  panelArray.forEach(function(panel) {
    panel.putm(msg);
  });
});

function startup() {

}

function sendm(mes) {
  log(mes);
  socket.emit(mes.to, mes);
}



function factoryStartup() {
  panelArray.push(new Panel({width: 200, height: 30, url: urlLoc + "panels/testPanel", id: 10}));
  panelArray.push(new Panel({width: 300, height: 300, url: urlLoc + "panels/testPanel", id: 11}));
  panelArray.push(new Panel()); panelArray.push(new Panel());
  addPanels(panelArray, "panelContainer");
}

function addPanels(pArr, to) {
  var container = document.getElementById(to);
  pArr.forEach(function(panel) {
    log(panel);
    panel.initElement();
    container.appendChild(panel.element);
    //TODO: figure out closure so that this can be put in the actual initElement()
    panel.draggable = new PlainDraggable(panel.element);
    panel.draggable.panel = panel;
    panel.draggable.onDragEnd = function(newPosition) {
      this.panel.alertMove();
    }
  });
}
