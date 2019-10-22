class Panel {

  constructor(type="launchPanel", id='0') {
    this.iden = {};
    this.iden.type = type;
    this.iden.id = id;
  }

  deleteSignal() {
    this.passm({appl:[this.iden.id], action: 'removePanel'});
    this.delete();
  }

  delete() {
    //TODO remove from panel list in manager
    this.element.remove();
  }

  createNew(type="launchPanel", id='0') {
    addPanel(new Panel(type, id));
  }

  initElement() {
    this.element = document.createElement("DIV");
    var ifr = document.createElement("IFRAME");
    ifr.setAttribute('src', "/main/panels/" + this.iden.type);
    this.element.appendChild(ifr);
    this.element.className += " panel";
    this.element.appendChild(this.iconBar());
    this.element.panel = this;
    this.setLoadingMode(true);
      //so that element-return DOM requests can access panel-specific//
    this.updSize(400, 200);
    ifr.panel = this;
    ifr.onload = function() {
      log(["iframe loaded: ", this]);
      this.panel.passm({action: 'initPanel'});
      //TODO figure out how to pass panel without assigning it to iframe
      //TODO it's some kind of nested "immediate function" thing
    }
  }

  setLoadingMode(set) {
    //TODO visual flair
  }

  iconBar() {
    var iconBar = document.createElement("DIV");
    iconBar.className += " iconBar";
    var moveIcon = document.createElement("IMG");
    moveIcon.url = "nothing";
    iconBar.appendChild(moveIcon);
    return iconBar;
  }

  alertMove() {
    this.passm({appl:[this.iden.id], action: 'movePanel', loc: {top: this.getTop(), left: this.getLeft()}});
  }

  alertResize() {
    this.passm({appl:[this.iden.id], action: 'resizePanel', loc: {width: this.getWidth(), height: this.getHeight()}});
  }

  passm(msg) {
    msg.from = this.iden;
    sendm(msg);
  }

  putm(msg) {
    if (msg && typeof(msg.action) !== 'undefined') {
      if (typeof(msg.appl) !== 'undefined' && msg.appl.includes(this.iden.id)) {
        switch(msg.action) {
          case 'removePanel':
            this.delete();
            break;
          case 'movePanel':
            this.updPos(msg.content.loc.top, msg.content.loc.left);
            break;
          case 'resizePanel':
            this.updSize(msg.content.loc.width, msg.content.loc.height);
            break;
          default: //otherwise passes it on to the child to figure out
            if (this.child && typeof(this.child.putm) === "function") {
              this.child.putm(msg);
            }
            break;
          }
          //TODO - at the moment, if you spawn another window of the same type
          //before the other one has received the panelInit response, they
          //might get confused and both end up with the same ID
          //low priority: difficult to cause, few downsides.
        } else if (msg.action == 'initPanel' && msg.content.type == this.iden.type
                          && (this.iden.id == '0' || msg.content.id == this.iden.id)) {
          this.updID(msg.content.id);
          this.updPos(msg.content.loc.top, msg.content.loc.left);
          this.updSize(msg.content.loc.width, msg.content.loc.height);
          this.element.children[0].contentWindow.init(this);
      }
    }
  }

  //############GET/SET##################

  updPos(top, left) {
    log(["updating position of panel to " + top + " " + left + " for: ", this.iden]);
    this.element.style.top = top + "px";
    this.element.style.left = left + "px";
  }

  updSize(width, height) {
    log(["updating size of panel to " + width + " " + height + " for: ", this.iden]);
    this.element.style.width = width + "px";
    this.element.style.height = height + "px";
  }

  assignChild(child) {
    this.child = child;
  }

  updID(id) {
    this.iden.id = id;
  }

  getID() {
    return this.iden.id;
  }

  getTop() {
    return this.element.style.top.parseFloat();
  }

  getLeft() {
    return this.element.style.left.parseFloat();
  }

  getHeight() {
    return this.element.style.height.parseFloat();
  }

  getWidth() {
    return this.element.style.width.parseFloat();
  }

}
