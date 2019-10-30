class Panel {

  constructor(type="launchPanel", id=getDefaultID()) {
    this.iden = {};
    this.iden.type = type;
    this.iden.id = id;
  }

  //temporarily prevents iframes from messing with dragging/resizing
  //small todo - better way?
  documentOverlay(bool) {
    if (bool) {
      document.getElementById("overlay").style.display = "block";
    } else {
      document.getElementById("overlay").style.display = "none";
    }
  }

  //todo fix repetitiveness. Is there a way to combine these that doesn't make things worse?
  //todo is setting them directly via .onmousewhatever good practice? find out, fix
  //todo don't alert on tiny moves
  resizing(clickLeft, clickTop) {
    log(["start resize drag from " + clickLeft + ", " + clickTop + " for panel: ", this]);
    this.documentOverlay(true);
    document.onmouseup = () => {
      log(["end resize drag on panel: ", this]);
      document.onmouseup = null;
      document.onmousemove = null;
      this.alertResize();
      this.documentOverlay(false);
    };
    document.onmousemove = (event) => {
      var height = event.clientY - this.getTop();
      var width = event.clientX - this.getLeft();
      this.updSize(this.snapSize(width), this.snapSize(height));
    };
  }

  dragging(clickLeft, clickTop) {
    log(["start relocation drag from " + clickLeft + ", " + clickTop + " for panel: ", this]);
    var offsetTop = this.getTop() - clickTop;
    var offsetLeft = this.getLeft() - clickLeft;
    this.documentOverlay(true);
    document.onmouseup = () => {
      log(["end relocation drag on panel: ", this]);
      document.onmouseup = null;
      document.onmousemove = null;
      this.alertMove();
      this.documentOverlay(false);
    };
    document.onmousemove = (event) => {
      var top = offsetTop + event.clientY;
      var left = offsetLeft + event.clientX;
      this.updPos(this.snapPos(top), this.snapPos(left));
    };
  }

  //TODO
  snapSize(value) {
    return value;
  }

  //TODO
  snapPos(value) {
    return value;
  }

  deleteSignal() {
    this.buildMessageAndSend('closePanel');
    this.delete();
  }

  delete() {
    removePanel(this);
    this.element.remove();
  }

  createNew(type="launchPanel") {
    addPanel(new Panel(type));
  }

  loadPanel(type, id) {
    this.buildMessageAndSend('loadPanel', [this.iden], {id: id, type: type});
  }

  initElement(parent, content) {
    var template = document.getElementById("panelTemplate");
    this.element = document.importNode(template.content, true).firstElementChild;
    this.element.children[1].setAttribute('src', "/main/panels/" + this.iden.type);
    this.element.panel = this;
    //so that element-return DOM requests can access panel-specific//
    this.element.children[1].onload = typeof content === 'undefined' ?
        () => {
      this.buildMessageAndSend('createPanel', [this.iden]);
    } : () => {
      this.firstTimeUpdate(content);
    }
    parent.appendChild(this.element);
  }

  setLoadingMode(set) {
    //TODO visual flair
  }

  alertMove() {
    this.buildMessageAndSend('movePanel', [this.iden], {loc: {top: this.getTop(), left: this.getLeft()}});
  }

  alertResize() {
    this.buildMessageAndSend('resizePanel', [this.iden], {loc: {width: this.getWidth(), height: this.getHeight()}});
  }

  //action: string. appl: who it applies to, content, other
  buildMessageAndSend(action, appl=[this.iden], content, other) {
    var msg = typeof other === 'object' ? other : {};
    if (typeof content !== 'undefined') msg.content = content;
    msg.appl = appl;
    msg.action = action;
    msg.from = this.iden;
    sendMessageToServer(msg);
  }

  //some way to get array.includes to compare like this?
  includesThis(applArray) {
    if (!Array.isArray(applArray)) return false;
    for (const identifier of applArray) {
      if (identifier.id == this.iden.id && identifier.type == this.iden.type) {
        return true;
      }
    }
    return false;
  }

  firstTimeUpdate(content) {
    log(["running first time setup for panel: ", this, "using content: ", content]);
    this.updID(content.id);
    this.updPos(content.loc.top, content.loc.left);
    this.updSize(content.loc.width, content.loc.height);
    this.element.children[1].contentWindow.init(this);
  }

  passMessageOn(msg) {
    if (msg && typeof(msg.action) !== 'undefined' && this.includesThis(msg.appl)) {
      switch(msg.action) {
        case 'createPanel':
          this.firstTimeUpdate(msg.content);
          break;
        case 'removePanel':
          this.delete();
          break;
        case 'movePanel':
          this.updPos(msg.content.loc.top, msg.content.loc.left);
          break;
        case 'resizePanel':
          this.updSize(msg.content.loc.width, msg.content.loc.height);
          break;
        default: //otherwise passes it on to the child to figure out //todo function check on server init instead?
          if (this.child && typeof this.child.passMessageOn === "function") {
            this.child.passMessageOn(msg);
          }
          break;
        }
      }
    }

  //############GET/SET##################

  alertChildtoChange() {
    if (this.child && typeof this.child.alertPanelChange === "function") {
      this.child.alertPanelChange();
    }
  }

  updPos(top, left) {
    this.element.style.top = top + "px";
    this.element.style.left = left + "px";
    this.alertChildtoChange();
  }

  updSize(width, height) {
    this.element.style.width = width + "px";
    this.element.style.height = height + "px";
    this.alertChildtoChange();
  }

  assignChild(child) {
    this.child = child;
  }

  updID(id) {
    var oldID = this.getStrID();
    this.iden.id = id;
    updatePanelID(oldID, this);
  }

  getIdentification() {
    return this.iden;
  }

  getStrID() {
    return this.iden.type + this.iden.id;
  }

  getID() {
    return this.iden.id;
  }

//we could collapse this into one function (type) (this.element.style[type])
  getTop() {
    return parseInt(this.element.style.top);
  }

  getLeft() {
    return parseInt(this.element.style.left);
  }

  getHeight() {
    return parseInt(this.element.style.height);
  }

  getWidth() {
    return parseInt(this.element.style.width);
  }

}
