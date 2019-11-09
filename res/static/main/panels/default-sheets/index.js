const editTemplate = '<div class="lightFontColor">#value#: <input type="text" data-targetID="#value#" class="editFields" autocomplete="new-password"/></div>';
const radioTemplate = '<div class="lightFontColor"><input type="radio" value="#value#" name="sheetSelect" data-type="#type#"/> #label#</div>';

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

function saveChanges() {
  var edits = document.getElementsByClassName("editFields");
  var changeObj = {};
  for (let element of edits) {
    if (element.value !== "")
      changeObj[element.dataset.targetid] = element.value;
      document.getElementById(element.dataset.targetid).innerHTML = element.value;
  }
  console.log(changeObj);
}

function populateSheets(message) {
  var div = document.getElementById('loadPage');
  message.content.sheetArray.forEach( (sheet) => {
    console.log(buildRadioDOM("[" + sheet.type + "] " + sheet.label, sheet.value, sheet.type));
    div.innerHTML += buildRadioDOM("[" + sheet.type + "] " + sheet.label, sheet.value, sheet.type);
  });
}

function buildRadioDOM(label, value, type) {
  return radioTemplate.replace(/#label#/, label).replace(/#value#/, value).replace(/#type#/, type);
}

function buildEditableBox(value) {
  return editTemplate.replace(/#value#/g, value);
}

function initSheet(message) {
  document.getElementById("sheet").innerHTML = message.content._html;
  this.charID = message.content._id;
  delete message.content._html;
  delete message.content._id;
  var edit = document.getElementById("edit");
  var editable = document.getElementsByClassName("edit");
  for (let element of editable) {
    edit.innerHTML += buildEditableBox(element.id);
  }
  document.getElementById("loadPage").style.display = "none";
  document.getElementById("mainContainer").style.display = "block";
  switchSheet();
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
