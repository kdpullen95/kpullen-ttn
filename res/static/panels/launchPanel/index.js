var iden = {type: 'launchPanel'};
//TODO: get ID

function init() {
  window.parent.sendm({to: 'db', from: iden, action: 'init'});
}

function putm(m) {

}
