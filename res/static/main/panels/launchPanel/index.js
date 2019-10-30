var panel;
var databasePanels;

function init(panel) {
  this.panel = panel;
  this.panel.assignChild(this);
  this.panel.buildMessageAndSend('init');
}

function passMessageOn(msg) {
  switch(msg.action) {
    case 'init':
      populatePanels(msg.content.panels);
      databasePanels = msg.content.databasePanels;
      updateOptions();
  }
}

function populatePanels(panels) {
  var dropdown = document.getElementById('panelSelect');
  Object.keys(panels).forEach(function (key) {
    var option = document.createElement('option');
    option.appendChild(document.createTextNode(panels[key]));
    option.value = key;
    dropdown.appendChild(option);
  });
}

function updateOptions() {
  var loadWhich = document.getElementById('loadWhich');
  var currentSelection = document.getElementById('panelSelect').value;
  while (loadWhich.firstChild) {
    loadWhich.removeChild(loadWhich.firstChild);
  }
  loadWhich.appendChild(buildCheckDOM("New Panel", "newPanel"));
  databasePanels[currentSelection].forEach( (pair) => {
    loadWhich.appendChild(buildCheckDOM(pair[0], pair[1]));
  });
}

function buildCheckDOM(label, value) {
  var check = document.createElement("INPUT");
  check.setAttribute("type", "checkbox");
  check.setAttribute("value", value);
  var div = document.createElement("DIV");
  div.appendChild(check);
  div.appendChild(document.createTextNode(label));
  return div;
}

function runSearch() {

}

function submitSelection() {
  var inputs = document.getElementsByTagName('input');
  for (var i = 0; i < inputs.length; i++) {
    if (inputs[i].checked) {
      if (inputs[i].value === 'newPanel') {
        this.panel.createNew(document.getElementById('panelSelect').value);
      } else {
        this.panel.loadPanel(document.getElementById('panelSelect').value, inputs[i].value);
      }
    }
  }
  this.panel.delete();
}
