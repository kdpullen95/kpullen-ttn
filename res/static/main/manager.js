var panelObj = {};
var socket = io();
var defaultIDNum = 1;
var templateList;
var user;

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
  user = {user: getURLVars()['user'], k: getURLVars()['k']};
  synchronizationRequest();
}

function processMessage(msg) {
  if (!msg) return;
  if (msg.action === 'createPanel' && !msg.affirm) {
    addPanel(new Panel(msg.content.type, msg.content.id), msg.content);
  } else if (msg.action === 'closePanel' && !msg.affirm) {
    removePanels(msg.appl);
  } else if (msg.action === 'clearTemplate') {
    clear();
  } else if (msg.action === 'updateTemplateList') {
    updateTemplateList(msg);
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
  Object.values(panelObj).forEach(function(panel) {
    panel.delete(); //todo more elegant solution + allow panels to be marked not clearing
  });
}

function startup() {
  clear();
  //P
  //get panel list and ids
  //push them all to a panel array (not panel array)
  //let initElement do the rest
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
    sendMessageToServer({action: 'saveCurrentTemplate', content: {name: name}});
  }
}

function updateTemplateList(message) {
  templateList = message.content.infoArray;
  var select = document.getElementById('templateSelect');
  var options = Array.from(select.options);
  options.forEach( (option) => {
    if (option.value !== "")
      select.remove(option);
  });
  templateList.forEach( (template) => {
    var opt = document.createElement("option");
    opt.value = template._id;
    opt.text = template.name;
    select.add(opt);
  });
}

function loadTemplate() {
  selectEle = document.getElementById("templateSelect");
  if (selectEle.value !== "") {
    sendMessageToServer({action: "loadTemplate", content: {id: selectEle.value}});
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
  element.parentElement.panel.resizing(event.clientX, event.clientY);

}

function startDrag(event, element) {
  element.parentElement.panel.dragging(event.clientX, event.clientY);
}

function closePanel(event, element) {
  element.parentElement.panel.deleteSignal();
}
