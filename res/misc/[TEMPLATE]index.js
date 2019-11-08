var panel;

//required functions:
//
function init(panel, themeURL) {
  this.panel = panel;
  this.panel.assignChild(this);
  //begin optional (if you don't plan to sync with themes, can remove)
  setTheme(themeURL);
  //end optional
  this.panel.buildMessageAndSend('init');
}

function passMessageOn(message) {
  switch(message.action) {
    case 'affirm':
      //do things
    case 'init':
      //insert other cases here as needed
    default:
  }
}
//end required functions


//optional functions beyond this point
function alertPanelChange() {
  //fires when the panel has been resized, may fire for more
  //related situations in the future (such as when the panel is moved in general)
}

function setTheme(url) {
  document.getElementById("themeCSS").href = url;
}
