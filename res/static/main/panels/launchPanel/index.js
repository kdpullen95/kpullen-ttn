function init(panel, themeURL) {
  this.panel = panel;
  this.panel.assignChild(this);
  setTheme(themeURL); //twice is bug workaround.
  setTheme(themeURL);
  this.panel.buildMessageAndSend('init');
}

function passMessageOn(msg) {
  switch(msg.action) {
    case 'init':
      populatePanels(msg.content.panels);
      this.databasePanels = msg.content.databasePanels;
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
  while (loadWhich.firstChild) { //could just remove loadWhich and make it again
    loadWhich.removeChild(loadWhich.firstChild);
  }
  this.databasePanels[currentSelection].forEach( (pair) => {
    loadWhich.appendChild(buildCheckDOM(pair[0], pair[1]));
  });
}

function buildCheckDOM(label, value) {
  var check = document.createElement("INPUT");
  check.setAttribute("type", "checkbox");
  check.setAttribute("value", value);
  check.setAttribute("onclick", "updateButtonText()");
  var div = document.createElement("DIV");
  div.appendChild(check); //todo label=
  div.appendChild(document.createTextNode(label));
  return div;
}

function runSearch() {

}

function submitSelection() {
  var inputs = document.getElementsByTagName('input');
  var inputsChecked = 0;
  for (var i = 0; i < inputs.length; i++) {
    if (inputs[i].checked) {
      inputsChecked++;
      this.panel.loadPanel(document.getElementById('panelSelect').value, inputs[i].value);
    }
  }
  if (inputsChecked === 0) {
    this.panel.createNew(document.getElementById('panelSelect').value);
  }
  this.panel.delete();
}

function updateButtonText() {
  var inputs = document.getElementsByTagName('input');
  var button = document.getElementById("submitButton");
  var inputsChecked = 0;
  for (var i = 0; i < inputs.length; i++) {
    if (inputs[i].checked) {
      inputsChecked++;
    }
  }
  if (inputsChecked === 0) {
    button.innerText = "Create New";
  } else {
    button.innerText = "Load Selection(s)";
  }
}

function setTheme(url) {
  document.getElementById("themeCSS").href = url;
}
