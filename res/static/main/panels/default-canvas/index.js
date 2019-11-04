var panel;
var brush = {};
var objectMenu;

function init(panel) {
  this.panel = panel;
  this.panel.assignChild(this);
  this.panel.buildMessageAndSend('init');
}

//&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
//&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
//&&&&&&&&&&&&&&&&&&&&&&&&&&MESSAGE HANDLING&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&

function passMessageOn(message) {
  switch(message.action) {
    case 'affirm':
      removePending(message.content.object, message.content.to);
    case 'create':
      createElements(message.content.object, message.content.to);
      break;
    case 'delete':
      deleteElement(message.content.object, message.content.to);
      break;
    case 'update':
      updateElement(message.content.object, message.content.to);
      break;
    case 'init':
      //todo initializeCanvases(msg.content);
      initializeCanvases({canvasSettings: [{id:'default'}]});
      break;
    default:
  }
}

function createElements(objectsJSON, to) {
  fabric.util.enlivenObjects(JSON.parse(objectsJSON), (liveObjects) => {
    liveObjects.forEach( (object) => {
      object.proppedFlag = true;
      canvasArray[to].add(object);
      canvasArray[to].renderAll();
    });
  });
}

function deleteElement(content) {

}

function updateElement(content) {

}

function addPending(content) {

}

function removePending(content) {

}

//&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//^^^^^^^^^^^^^^^^^^^^^^^^^^^USER CONTROLS^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
function getCanvasID(object) {
  return 'default'; //todo
}

function userUpdateElement(object) {
  var message = {};
  message.object = JSON.stringify([object]);
  message.to = getCanvasID(object);
  this.panel.buildMessageAndSend('update', [this.panel.getIdentification()], message);
}

function userDeleteElement(object) {
  var message = {};
  message.object.id = object.id;
  message.to = getCanvasID(object);
  this.panel.buildMessageAndSend('delete', [this.panel.getIdentification()], message);
}

function userCreateElement(object) {
  if (object.proppedFlag) return;
  initializeElement(object);
  var message = {};
  object.id = new Date().getTime(); //todo make this a more robust id (assign on server?)
  message.object = JSON.stringify([object]); //why am I dropping info if I don't do this?
  message.to = getCanvasID(object);
  this.panel.buildMessageAndSend('create', [this.panel.getIdentification()], message);
}

function alertPanelChange() {
  for (var key in canvasArray) {
    canvasArray[key].setHeight(this.panel.getHeight());
    canvasArray[key].setWidth(this.panel.getWidth());
    canvasArray[key].renderAll();
  }
}

function optionsFreeDraw(event, ele) {
  var canvas = getCanvas(ele);
  clearOptionsSelection(canvas);
  updFreeDraw(canvas);
  canvas.isDrawingMode = true;
}

function updFreeDraw(canvas) {
  canvas.freeDrawingBrush = canvas.userBrush;
  canvas.freeDrawingBrush.color = canvas.userLineColor;
  canvas.freeDrawingBrush.width = canvas.userLineWidth;
}

function optionsCreateShape(event, ele) {

}

function optionsLineColor(event, ele) {
  var canvas = getCanvas(ele.parentNode);
  canvas.userLineColor = ele.value;
  updFreeDraw(canvas);
}

function optionsFillColor(event, ele) {
  getCanvas(ele.parentNode).userFillColor = ele.value;
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

function optionsDeleteSelected(event, ele) {
  var canvas = getCanvas(ele.parentNode);
  console.log(canvas.getActiveObjects());
  canvas.getActiveObjects().forEach( (obj) => {
    canvas.remove(obj);
  });
}

function clearSelectionMenu(ev) {
  ev = ev.deselected ? ev.deselected[0] : ev.target;
  ev.canvas.objectMenu.style.height = "0px";
}

function openSelectionMenu(objects) {
  objects[0].canvas.objectMenu.style.height = "100px";
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

//******************************************************************************
//******************************************************************************
//****************************INITIALIZATION************************************

function initializeElement(object) {
  //put any init stuff here
}

function initializeCanvases(content) {
  this.canvasArray = {};
  content.canvasSettings.forEach((settings) => {
    canvasArray[settings.id] = initializeCanvas(settings);
  });
  alertPanelChange();
}

function initializeBrushes(canvas) {
  return {
    pencil: new fabric.PencilBrush(canvas)
  };
}

function initializeCanvas(settings) {
  var template = document.getElementById("canvasTemplate");
  var element = document.importNode(template.content, true).firstElementChild;
  var c = element.children[1].firstElementChild;
  c.id = settings.id;
  document.getElementById('canvasesContainer').appendChild(element);
  c.fabric = new fabric.Canvas(settings.id);

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
  c.fabric.on("selection:updated", function(e) { openSelectionMenu(e.selected) });
  c.fabric.on("selection:created", function(e) { openSelectionMenu(e.selected) });
  c.fabric.on("selection:cleared", function(e) { clearSelectionMenu(e) });

  c.fabric.brushes = initializeBrushes(c.fabric);
  c.fabric.userLineColor = '#000000'; //todo grab this from html
  c.fabric.userFillColor = '#ffffff'; //ditto
  c.fabric.userLineWidth = 3;         //
  c.fabric.userBrush = c.fabric.brushes.pencil;
  c.fabric.objectMenu = element.querySelector(".objectMenu");

  return c.fabric;
}
