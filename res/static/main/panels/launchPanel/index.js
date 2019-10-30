var panel;

function init(panel) {
  this.panel = panel;
  this.panel.assignChild(this);
  this.panel.buildMessageAndSend('init');
}

function passMessageOn(msg) {
  switch(msg.action) {
    case 'init':
      populatePanels(msg.content);
      break;
    default:
      break;
  }
}

function populatePanels(panelArray) {
  var dropdown = document.getElementById('panelSelect');
  for (var i in panelArray) {
    var option = document.createElement('option');
    option.appendChild(document.createTextNode(panelArray[i][1]));
    option.value = panelArray[i][0];
    dropdown.appendChild(option);
  }
}

function submitSelection() {
  this.panel.createNew(document.getElementById('panelSelect').value);
  this.panel.delete();
}
