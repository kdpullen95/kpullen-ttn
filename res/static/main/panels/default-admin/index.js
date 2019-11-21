var panel;

function init(panel, themeURL) {
  this.panel = panel;
  this.panel.assignChild(this);
  setTheme(themeURL);
  this.panel.buildMessageAndSend('init');
}

function passMessageOn(message) {
  switch(message.action) {
    case 'init':
    case 'sync':
      populateUsers(message.content.users);
      break;
    case 'createUser':
    case 'deleteUser':
      if (message.affirm)
        this.panel.buildMessageAndSend('sync');
    default:
  }
}

function alertPanelChange() {}

function setTheme(url) {
  document.getElementById("themeCSS").href = url;
}

function promptAddUser() {
  var name = prompt("User name: ", "");
  if (name !== null && name !== "") {
    this.panel.buildMessageAndSend('createUser', [this.panel.getIdentification()], {user: name});
  }
}

function populateUsers(users) {
  if (typeof users !== 'undefined') {
    var div = document.getElementById("userManagement");
    div.removeChild(document.getElementById("userBox"));
    var userBox = document.createElement("DIV");
    userBox.id = "userBox";
    div.appendChild(userBox);
    users.forEach( (user) => {
      var userDiv = document.createElement("DIV");
      userDiv.appendChild(document.createTextNode(user._id + " " + user.pin));
      userBox.appendChild(userDiv);
    });
  }
}
