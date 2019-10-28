var panel;

function init(panel) {
  this.panel = panel;
  this.panel.assignChild(this);
  this.panel.buildMessageAndSend('init');
}

function passMessageOn(msg) {
  switch(msg.action) {
    case 'affirm':
      removePending(msg.content);
    case 'create':
      createElement(msg.content);
      break;
    case 'delete':
      deleteElement(msg.content);
      break;
    case 'update':
      updateElement(msg.content);
      break;
    case 'init':
      //todo initializeCanvases(msg.content);
      initializeCanvases({canvasNames: ['default']});
      break;
    default:
  }
}

function initializeCanvases(content) {
  this.canvasArray = {};
  content.canvasNames.forEach((name) => {
    canvasArray[name] = initializeCanvas(name);
  });
  alertPanelChange();
}

function initializeCanvas(id) {
  var template = document.getElementById("canvasTemplate");
  var element = document.importNode(template.content, true).firstElementChild
  var c = element.children[1].firstElementChild;
  c.id = id;
  document.getElementById('canvasesContainer').appendChild(element);
  c.fabric = new fabric.Canvas(id);

  //!!!!!!!!!BEGIN OUTSIDE CODE!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  //////Section taken from http://fabricjs.com/fabric-intro-part-5//////////////
  c.fabric.on('mouse:wheel', (opt) => {
    var delta = opt.e.deltaY;
    var pointer = c.fabric.getPointer(opt.e);
    var zoom = c.fabric.getZoom();
    zoom = zoom + delta/200;
    if (zoom > 20) zoom = 20;
    if (zoom < 0.5) zoom = 0.5;
    c.fabric.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
    opt.e.preventDefault();
    opt.e.stopPropagation();
  });
  c.fabric.on('mouse:down', function(opt) {
    if (this.isPanningMode) {
      this.isDragging = true;
      this.selection = false;
      this.lastPosX = opt.e.clientX;
      this.lastPosY = opt.e.clientY;
    }
  });
  c.fabric.on('mouse:move', function(opt) {
    if (this.isDragging && this.isPanningMode) {
      var e = opt.e;
      this.viewportTransform[4] += e.clientX - this.lastPosX;
      this.viewportTransform[5] += e.clientY - this.lastPosY;
      this.requestRenderAll();
      this.lastPosX = e.clientX;
      this.lastPosY = e.clientY;
    }
  });
  c.fabric.on('mouse:up', function(opt) {
    this.isDragging = false;
    this.selection = true;
  });
  //!!!!!!!!!END OUTSIDE CODE!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

  c.fabric.on("object:modified", function(e) { userUpdateElement(e.target); });
  c.fabric.on("object:added", function(e) { userCreateElement(e.target); });
  c.fabric.on("object:removed", function(e) { userDeleteElement(e.target); });
  return c.fabric;
}

function initializeElement(object) {
  //put any init stuff here
}

function userUpdateElement(object) {
  var message = {};
  message.object = object.toJSON(["id"]);
  this.panel.buildMessageAndSend('update', [this.panel.getIdentification()], message);
}

function userCreateElement(object) {
  initializeElement(object);
  var message = {};
  object.id = new Date().getTime(); //todo make this a more robust id
  message.object = JSON.stringify(object);
  message.to = 'default'; //todo get actual id
  this.panel.buildMessageAndSend('create', [this.panel.getIdentification()], message);
}

function userDeleteElement(object) {
  var message = {};
  message.objectID = object.id;
  this.panel.buildMessageAndSend('delete', [this.panel.getIdentification()], message);
}

function alertPanelChange() {
  for (var key in canvasArray) {
    canvasArray[key].setHeight(this.panel.getHeight());
    canvasArray[key].setWidth(this.panel.getWidth());
    canvasArray[key].renderAll();
  }
}

function addPending(content) {

}

function removePending(content) {

}

function createElement(content) {
  return; //todo why 
  fabric.util.enlivenObjects([content.object], (objects) => {
    canvasArray[content.to].add(objects[0]);
  });
}

function deleteElement(content) {

}

function updateElement(content) {

}

function optionsFreeDraw(event, ele) {
  var canvas = getCanvas(ele);
  clearOptionsSelection(canvas);
  canvas.isDrawingMode = true;
}

function optionsCreateShape(event, ele) {

}

function optionsLineColor(event, ele) {

}

function optionsFillColor(event, ele) {

}

function optionsMouse(event, ele) {
  clearOptionsSelection(getCanvas(ele));
}

function optionsPan(event, ele) {
  var canvas = getCanvas(ele);
  clearOptionsSelection(canvas);
  canvas.isPanningMode = true;
}

function getCanvas(ele) {
  return ele.parentNode.parentNode.children[1].firstElementChild.firstElementChild.fabric;
}

function clearOptionsSelection(canvas) {
  canvas.isDrawingMode = false;
  canvas.isPanningMode = false;
}
