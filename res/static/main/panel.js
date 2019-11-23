class Panel {

  constructor(type="launchPanel", id=getDefaultID()) {
    this.iden = {};
    this.iden.type = type;
    this.iden.id = id;
  }

  //todo fix repetitiveness. Is there a way to combine these that doesn't make things worse?
  //todo is setting them directly via .onmousewhatever good practice? find out, fix
  //todo don't alert on tiny moves or stray clicks
  resizing(clickLeft, clickTop) {
    log(["start resize drag from " + clickLeft + ", " + clickTop + " for panel: ", this]);
    documentOverlay(true);
    document.onmouseup = () => {
      log(["end resize drag on panel: ", this]);
      document.onmouseup = null;
      document.onmousemove = null;
      this.alertResize();
      documentOverlay(false);
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
    documentOverlay(true);
    document.onmouseup = () => {
      log(["end relocation drag on panel: ", this]);
      document.onmouseup = null;
      document.onmousemove = null;
      this.alertMove();
      documentOverlay(false);
    };
    document.onmousemove = (event) => {
      var top = offsetTop + event.clientY;
      var left = offsetLeft + event.clientX;
      this.updPos(this.snapPos(top), this.snapPos(left));
    };
  }

  snapSize(value) {
    if (getGridSize() == 0) return value;
    var num = getGridSize() * Math.round(value/getGridSize());
    return num == 0 ? getGridSize() : num;
  }

  snapPos(value) {
    if (getGridSize() == 0) return value;
    return getGridSize() * Math.round(value/getGridSize());
  }

  deleteSignal() {
    this.buildMessageAndSend('panel:close');
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
    this.buildMessageAndSend('panel:load', [this.iden], {id: id, type: type});
  }

  initElement(parent, content) {
    var template = document.getElementById("panelTemplate");
    this.element = document.importNode(template.content, true).firstElementChild;
    this.element.children[1].setAttribute('src', "/main/panels/" + this.iden.type);
    this.element.panel = this;
    //so that element-return DOM requests can access panel-specific//
    this.element.children[1].onload = typeof content === 'undefined' ?
        () => {
      this.buildMessageAndSend('panel:create', [this.iden]);
    } : () => {
      this.firstTimeUpdate(content);
    }
    parent.appendChild(this.element);
  }

  setLoadingMode(set) {
    //TODO visual flair
  }

  alertMove() {
    this.buildMessageAndSend('panel:move', [this.iden], {loc: {top: this.getTop(), left: this.getLeft()}});
  }

  alertResize() {
    this.buildMessageAndSend('panel:resize', [this.iden], {loc: {width: this.getWidth(), height: this.getHeight(), z: this.getzIndex()}});
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
    this.setzIndex(5);
    this.element.children[1].contentWindow.init(this, getThemeURL());
  }

  passMessageOn(msg) {
    if (msg && typeof(msg.action) !== 'undefined' && this.includesThis(msg.appl)) {
      switch(msg.action) {
        case 'panel:create':
          this.firstTimeUpdate(msg.content);
          break;
        case 'panel:close':
          this.delete();
          break;
        case 'panel:move':
          this.updPos(msg.content.loc.top, msg.content.loc.left);
          break;
        case 'panel:resize':
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

    alertChildtoChange() {
      if (this.child && typeof this.child.alertPanelChange === "function") {
        this.child.alertPanelChange();
      }
    }

    alertChildtoThemeChange(url) {
      if (this.child && typeof this.child.setTheme === "function") {
        this.child.setTheme(url);
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


  //############GET/SET##################

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

  getzIndex() {
    return this.element.style.zIndex;
  }

  modifyzIndex(x) {
    this.element.style.zIndex = x + parseInt(this.element.style.zIndex);
  }

  setzIndex(x) {
    this.element.style.zIndex = x;
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
