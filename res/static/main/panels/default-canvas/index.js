var panel;
var brush = {};
var objectMenu;
var count = 0;

function init(panel, themeURL) {
  this.panel = panel;
  this.panel.assignChild(this);
  setTheme(themeURL); //todo figure out why first request receives wrong MIME, then delete
  setTheme(themeURL);
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
      createElements(message.content.objects, message.content.to);
      break;
    case 'delete':
      deleteElement(message.content.object, message.content.to);
      break;
    case 'update':
      updateElement(message.content.objects, message.content.to);
      break;
    case 'updateSettings':
      updateCanvasSettings(message.content.settings, message.content.to);
      break;
    case 'init':
      //todo initializeCanvases(msg.content);
      initializeCanvases({canvasSettings: [{id:'default'}]});
      break;
    default:
  }
}

function createElements(objectsJSON, to) {
  objectsJSON = JSON.parse(objectsJSON);
  console.log(objectsJSON);
  canvasArray[to].renderOnAddRemove = false;
  objectsJSON.forEach( (object) => {
    createElement(object, canvasArray[to], {id: object.id});
  });
  canvasArray[to].renderOnAddRemove = true;
  canvasArray[to].renderAll();
}

function createElement(object, canvas, extraFields) {
  fabric.util.enlivenObjects([object], (liveObjects) => {
    liveObjects[0].creationSignalled = true;
    //spread operator breaks object, so it seems this is the only way
    liveObjects[0].id = extraFields.id;
    canvas.add(liveObjects[0]);
  });
}

function deleteElement(object, to) {
  canvasArray[to].forEachObject( (ob) => {
    if (object.id == ob.id) {
      ob.deleteSignalled = true;
      canvasArray[to].remove(ob);
    }
  });
}

function updateCanvasSettings(settings, to) {
  Object.keys(settings).forEach((key) => {
    setUpdate(key, settings[key], to);
  });
  canvasArray[to].renderAll();
}

function updateElement(objects, to) {
  objects = JSON.parse(objects);
  objects.forEach( (object) => {
    deleteElement(object, to);
    createElement(object, canvasArray[to], {id: object.id});
  });
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

function userUpdateElement(ev) {
  var object = ev.target; //pay special attention to group object todo
  if (object.updateSignalled) {
    object.updateSignalled = false;
    return;
  }
  this.panel.buildMessageAndSend('update', [this.panel.getIdentification()],
                                {objects: JSON.stringify([object.toJSON(["id"])]), to: getCanvasID(object)});
}

function userDeleteElement(object) {
  //only one element can be deleted at a time, no need to check?
  if (object.deleteSignalled) return;
  this.panel.buildMessageAndSend('delete', [this.panel.getIdentification()],
                                {object: {id: object.id}, to: getCanvasID(object)});
}

//todo simulate a click or SOMETHING so that it'll kick the object off the secondary canvas and onto the real one
function userCreateElement(object) {
  object.canvas.renderAll();
  if (object.creationSignalled) return;
  initializeElement(object);
  var message = {};
  object.id = generateObjectID();
  message.objects = JSON.stringify([object.toJSON(["id"])]); //why am I dropping info/unable to enliven if I don't do this?
                                //specifically, it can't load if I don't do the JSON.stringify and parse it on the other end
  message.to = getCanvasID(object);
  //gee billy don't you love library bugs
  object.deleteSignalled = true;
  canvasArray[message.to].remove(object);
  createElements(message.objects, message.to);
  this.panel.buildMessageAndSend('create', [this.panel.getIdentification()], message);
}

function generateObjectID() {
  return new Date().getTime() + " count" + (count++);
  //todo does it need to be more robust? the chances of overlap due to time resync once count is added in are fleetingly low
}

function alertPanelChange() {
  for (var key in canvasArray) {
    canvasArray[key].setHeight(this.panel.getHeight());
    canvasArray[key].setWidth(this.panel.getWidth());
    canvasArray[key].renderAll();
  }
}

function userFreeDraw(event, ele) {
  var canvas = getCanvas(ele);
  clearUserSelection(canvas);
  updFreeDraw(canvas);
  canvas.isDrawingMode = true;
}

function updFreeDraw(canvas) {
  canvas.freeDrawingBrush = canvas.userBrush;
  canvas.freeDrawingBrush.color = canvas.userLineColor;
  canvas.freeDrawingBrush.width = canvas.userLineWidth;
}

function userCreateShape(event, ele) {

}

function userLineColor(event, ele) {
  var canvas = getCanvas(ele.parentNode);
  canvas.userLineColor = ele.value;
  updFreeDraw(canvas);
}

function userLineWidth(event, ele) {
  var canvas = getCanvas(ele.parentNode);
  canvas.userLineWidth = ele.value;
  updFreeDraw(canvas);
}

function userFillColor(event, ele) {
  getCanvas(ele.parentNode).userFillColor = ele.value;
}

function userBackgroundColor(event, ele) {
  var canvas = getCanvas(ele.parentNode);
  canvas.backgroundColor = ele.value;
  canvas.renderAll();
  this.panel.buildMessageAndSend('updateSettings', [this.panel.getIdentification()],
                                {settings: {backgroundColor: ele.value}, to: canvas.canvasID});
}

function userMouse(event, ele) {
  clearUserSelection(getCanvas(ele));
}

function userPan(event, ele) {
  var canvas = getCanvas(ele);
  clearUserSelection(canvas);
  canvas.isPanningMode = true;
}

function userInsertImage(event, ele) {
  var canvas = getCanvas(ele);
  var url = prompt("Enter Image URL: ", "");
  if (url !== null && url !== "") {
    fabric.Image.fromURL(url, (img) => {
      canvas.add(img);
    });
  }
}

function getCanvas(ele) {
  return ele.parentNode.parentNode.children[1].firstElementChild.firstElementChild.fabric;
}

function clearUserSelection(canvas) {
  canvas.isDrawingMode = false;
  canvas.isPanningMode = false;
}

function userDeleteSelected(event, ele) {
  var canvas = getCanvas(ele.parentNode);
  canvas.getActiveObjects().forEach( (obj) => {
    canvas.remove(obj);
  });
  //clear active objects/selection here todo
}

function userDuplicateSelected(event, ele) {
  var canvas = getCanvas(ele.parentNode);
  canvas.getActiveObjects().forEach( (obj) => {
    obj.clone( (clone) => {
      clone.id = generateObjectID();
      clone.set({ left: obj.left + 10, top: obj.top + 10});
      canvas.add(clone);
    });
  });
}

function clearSelectionMenu(ev) {
  ev = ev.deselected ? ev.deselected[0] : ev.target;
  ev.canvas.objectMenu.style.height = "0px";
}

function openSelectionMenu(objects) {
  console.log(objects);
  console.log(canvasArray['default']);
  objects[0].canvas.objectMenu.style.height = "100px";
}

function setUpdate(type, value, to) {
  canvasArray[to][type] = value;
  canvasArray[to].elementGroup.querySelector("input." + type).value = value;
}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

//******************************************************************************
//******************************************************************************
//****************************INITIALIZATION************************************

function setTheme(url) {
  document.getElementById("themeCSS").href = url;
}

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
  c.fabric.canvasID = settings.id;

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

  c.fabric.on("object:modified", function(e) { userUpdateElement(e); });
  c.fabric.on("object:added", function(e) { userCreateElement(e.target); });
  c.fabric.on("object:removed", function(e) { userDeleteElement(e.target); });
  c.fabric.on("selection:updated", function(e) { openSelectionMenu(e.selected) });
  c.fabric.on("selection:created", function(e) { openSelectionMenu(e.selected) });
  c.fabric.on("selection:cleared", function(e) { clearSelectionMenu(e) });

  c.fabric.brushes = initializeBrushes(c.fabric);

  c.fabric.userLineColor = element.querySelector("input.userLineColor").value;
  c.fabric.userFillColor = element.querySelector("input.userFillColor").value;
  c.fabric.userLineWidth = element.querySelector("input.userLineWidth").value;
  c.fabric.backgroundColor = element.querySelector("input.backgroundColor").value;

  c.fabric.elementGroup = element;
  c.fabric.objectMenu = element.querySelector(".objectMenu");
  c.fabric.userBrush = c.fabric.brushes.pencil;
  c.fabric.renderAll();

  return c.fabric;
}
