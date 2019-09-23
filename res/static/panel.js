class Panel {

  constructor(type="launchPanel",id='0') {
    this.iden = {};
    this.iden.type = type;
    this.iden.id = id;
  }

  initElement() {
    this.element = document.createElement("DIV");
    var ifr = document.createElement("IFRAME");
    ifr.setAttribute('src', "/panels/" + this.iden.type);
    ifr.panel = this;
    ifr.onload = function() {
      log(this);
      this.contentWindow.init(this.panel);
      //TODO figure out how to pass panel without assigning it to iframe
      //TODO it's some kind of nested "immediate function" thing
    }
    this.element.appendChild(ifr);
    this.element.className += " panel";
    this.element.appendChild(this.iconBar());
    this.element.panel = this;
      //so that element-return DOM requests can access panel-specific//
    this.updSize(400, 200);
    this.setLoadingMode(true);
    this.passm({action: 'init'});
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
    this.passm({appl:[this.iden.id], action: 'move', top: this.getTop(), left: this.getLeft()});
  }

  alertResize() {
    this.passm({appl:[this.iden.id], action: 'resize', width: this.getWidth(), height: this.getHeight()});
  }

  passm(msg) {
    msg.from = this.iden;
    sendm(msg);
  }

  putm(msg) {
    if (typeof(msg.action) !== 'undefined' && typeof(msg.appl) !== 'undefined' && msg.appl.includes(this.iden.id)) {
      switch(msg.action) {
        case 'move':
          this.updPos(msg.top, msg.left);
          break;
        case 'resize':
          this.updSize(msg.width, msg.height);
          break;
        default: //otherwise passes it on to the child to figure out
          if (this.child && typeof(this.child.putm) === "function") {
            this.child.putm(msg);
          }
        break;
      }
    }
  }

  //############GET/SET##################

  updPos(top, left) {
    log("updating position of panel " + this.iden);
    this.element.style.top = top + "px";
    this.element.style.left = left + "px";
  }

  updSize(width, height) {
    log("updating size of panel " + this.iden);
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
