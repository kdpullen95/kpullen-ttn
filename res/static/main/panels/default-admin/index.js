const userSliceTemplate = '<img class="icon userDeleteIcon" src="icons/delete.png" onmouseup="promptDeleteUser(event, this)" data-user="$user$"/> $user$ $pin$';

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

function promptDeleteUser(ev, ele) {
  var name = prompt("Enter user's name to confirm.", "");
  if (name === ele.dataset.user) {
    this.panel.buildMessageAndSend('deleteUser', [this.panel.getIdentification()], {user: ele.dataset.user});
  }
}

function populateUsers(users) {
  var div = document.getElementById("userManagement");
  div.removeChild(document.getElementById("userBox"));
  var userBox = document.createElement("DIV");
  userBox.id = "userBox";
  div.appendChild(userBox);
  if (Array.isArray(users)) {
    document.getElementById("addUserIcon").style.display = "block";
    users.forEach( (user) => {
      var userDiv = document.createElement("DIV");
      userDiv.innerHTML = userSliceTemplate.replace(/\$user\$/g, user._id).replace("$pin$", user.pin);
      userBox.appendChild(userDiv);
    });
  } else {
    document.getElementById("addUserIcon").style.display = "none";
    userBox.appendChild(denialDiv());
  }
}

function denialDiv() {
  var denDiv = document.createElement("DIV");
  denDiv.appendChild(document.createTextNode("Insufficient Permissions"));
  denDiv.classList.add("warningFontColor");
  return denDiv;
}
