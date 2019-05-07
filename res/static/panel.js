class Panel {

  constructor(opt) {
    if (opt) {
      this.opt = opt
    } else { //empty constructor version
      this.opt = {width: 200, height: 200, url: "/panels/launchPanel", id: 0};
    }
  }

  initElement() {
    if (!this.element) { //TODO: potentially check if correctly made too?
      this.element = document.createElement("DIV");
      var ifr = document.createElement("IFRAME");
      ifr.setAttribute('src', this.opt.url);
      ifr.onload = function() {
        log(this);
        this.contentWindow.init();
      }
      this.element.appendChild(ifr);
      this.element.className += " panel";
      this.element.style.width = this.opt.width + "px";
      this.element.style.height = this.opt.height + "px";
      this.element.appendChild(this.iconBar());
      this.element.panel = this;
      //so that element-return DOM requests can access panel-specific//
    }
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
    sendm({to: 'db', from: this.opt.id, appl:[this.opt.id], action: 'move', top: this.draggable.rect.top, left: this.draggable.rect.left});
  }

  putm(msg) {
    if (msg.action && msg.appl && msg.appl.includes(this.opt.id)) {
      if (msg.action == 'move') {
        this.updPos(msg.top, msg.left);
      }
    }
  }

  //############GET/SET##################

  updPos(top, left) {
    log("updating position of panel " + this.opt.id);
    this.element.style.top = top + "px";
    this.element.style.left = left + "px";
  }

  updID(id) {
    this.opt.id = id;
  }

}
