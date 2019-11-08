function init(panel, themeURL) {
  this.panel = panel;
  this.panel.assignChild(this);
  setTheme(themeURL);
  this.panel.buildMessageAndSend('init');
}

function passMessageOn(message) {
  switch(message.action) {
    case "init":
      populateSheets(message);
      break;
    case "initSheet":
      initSheet(message);
      break;
    default:
  }
}

function populateSheets(message) {
  var div = document.getElementById('loadPage');
  message.content.sheetArray.forEach( (sheet) => {
    div.appendChild(buildRadioDOM("[" + sheet.type + "] " + sheet.label, sheet.value, sheet.type));
  });
}

function buildRadioDOM(label, value, type) {
  var radio = document.createElement("INPUT");
  radio.setAttribute("type", "radio");
  radio.setAttribute("value", value);
  radio.setAttribute("name", "sheetSelect");
  radio.setAttribute("data-type", type);
  var l = document.createElement("label");
  l.appendChild(radio); //todo label= works?
  l.innerHTML += label;
  //div.appendChild(document.createTextNode(label));
  var div = document.createElement("DIV");
  div.appendChild(l);
  return div;
}

function initSheet(message) {
  document.getElementById("sheet").innerHTML = message.content._html;
  this.charID = message.content._id;
  delete message.content._html;
  delete message.content._id;
  var edit = document.getElementById("edit");

  document.getElementById("loadPage").style.display = "none";
  document.getElementById("mainContainer").style.display = "block";
}

function submitSelection() {
  var select = document.querySelector('input[name="sheetSelect"]:checked');
  var name = "";
  if (select.value == "new") {
    name = prompt("Enter Character Name: ", "");
    if (name === null || name === "") return;
  }
  this.panel.buildMessageAndSend("initSheet", [this.panel.getIdentification()], {charID: select.value, type: select.dataset.type, name: name});
}

function switchSheet() {
  document.getElementById("edit").style.display = "none";
  document.getElementById("sheet").style.display = "block";
  document.getElementById("notes").style.display = "none";
}

function switchEdit() {
  document.getElementById("edit").style.display = "block";
  document.getElementById("sheet").style.display = "none";
  document.getElementById("notes").style.display = "none";
}

function switchNotes() {
  document.getElementById("edit").style.display = "none";
  document.getElementById("sheet").style.display = "none";
  document.getElementById("notes").style.display = "block";
}

function setTheme(url) {
  document.getElementById("themeCSS").href = url;
}
