var iden = {type: 'testPanel'};
//TODO: get ID

function init() {
  window.parent.sendm({to: 'db', from: iden, action: 'init'});
}

function putm(m) {

}
