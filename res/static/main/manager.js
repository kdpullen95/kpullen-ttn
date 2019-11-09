var panelObj = {};
var socket = io();
var defaultIDNum = 1;
var templateList;
var user;
var menuShow = true;
var gridSize;

socket.on('res', function (msg) {
  log(['received message: ', msg]);
  processMessage(msg);
});

//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// code from https://html-online.com/articles/get-url-parameters-javascript/
//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
function getURLVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}
//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

function grabUserDataAndSync() {
  user = {name: getURLVars()['user'], k: getURLVars()['k']};
  synchronizationRequest();
  gridSize = document.getElementById("gridSizeSelector").value;
}

function processMessage(msg) {
  if (!msg) return;
  if (msg.action === 'panel:create' && !msg.affirm) {
    addPanel(new Panel(msg.content.type, msg.content.id), msg.content);
  } else if (msg.action === 'template:clear') {
    clear();
  } else if (msg.action === 'template:updateList') {
    updateTemplateList(msg);
  } else if (msg.action === 'theme:updateList') {
    updateThemeList(msg);
  } else if (msg.action === 'client:bulk') {
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
  sendMessageToServer({action: "client:synchronize", from: {type: 'manager'}});
}

function clear() {
  Object.values(panelObj).forEach(function(panel) {
    panel.delete(); //todo more elegant solution + allow panels to be marked not clearing
  });
}

function sendMessageToServer(mes) {
  mes.user = user;
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

function saveTemplate() {
  var name = prompt("Enter a Name for Template: ", "");
  if (name !== null) {
    if (name === "") {
      name = new Date().getTime();
    }
    sendMessageToServer({action: 'template:save', content: {name: name}});
  }
}

function updateTemplateList(message) {
  templateList = message.content.infoArray;
  var select = document.getElementById('templateSelect');
  Array.from(select.options).forEach( (option) => {
    select.remove(option);
  });
  templateList.forEach( (template) => {
    var opt = document.createElement("option");
    opt.value = template._id;
    opt.text = template.name;
    select.add(opt);
  });
}

function updateThemeList(message) {
  var select = document.getElementById("themeSelect");
  Array.from(select.options).forEach( (option) => {
    select.remove(option);
  });
  message.content.themeArray.forEach( (theme) => {
    var opt = document.createElement("option");
    opt.value = theme;
    opt.text = theme.slice(0, -4);
    select.add(opt);
  });
  select.value = message.content.default;
  themeSelect(select);
}

function loadTemplate() {
  selectEle = document.getElementById("templateSelect");
  if (selectEle.value !== "") {
    sendMessageToServer({action: "template:load", content: {id: selectEle.value}});
  }
}

function removePanel(panel) {
  delete panelObj[panel.getStrID()];
}

function updatePanelID(oldStrID, panel) {
  delete panelObj[oldStrID];
  panelObj[panel.getStrID()] = panel;
}

function startResize(event, element) {
  var p = element.parentElement.panel;
  p.resizing(event.clientX, event.clientY);

}

function startDrag(event, element) {
  var p = element.parentElement.panel;
  bringToFront(p);
  p.dragging(event.clientX, event.clientY);
}

function closePanel(event, element) {
  element.parentElement.panel.deleteSignal();
}

function bringToFront(panel) {
  var max = 0;
  Object.values(panelObj).forEach((p) => {
    max = p.getzIndex() > max ? p.getzIndex() : max;
    if (p.getzIndex() >= panel.getzIndex() && p.getzIndex() > 1) {
      p.modifyzIndex(-1);
    }
  });
  panel.setzIndex(max);
}

function sendToBack(panel) {

}

function bringForward(panel) {

}

function sendBackward(panel) {

}

function themeSelect(element) { //todo load themes like templates, dynamically
  var url = "../css/themes/" + element.value;
  document.getElementById("themeCSS").href = url;
  Object.values(panelObj).forEach(function(panel) {
    panel.alertChildtoThemeChange("../../" + url);
  });
}

function hideShowMenu(element) {
  if (menuShow) {
    element.src = "../icons/showMenu.png";
    document.getElementById("menuContainer").style.height = "0px";
  } else {
    element.src = "../icons/hideMenu.png";
    document.getElementById("menuContainer").style.height = "auto";
  }
  menuShow = !menuShow;
}

function getThemeURL() {
  return "../../../css/themes/" + document.getElementById("themeSelect").value;
}

function getGridSize() {
  return gridSize;
}

function modifyGridSizeSelector(ev, element) {
  setGridSize(element.value);
}

function setGridSize(num) {
  gridSize = num;
  document.getElementById("underlay").style.backgroundSize = gridSize + "px " + gridSize + "px";
}
