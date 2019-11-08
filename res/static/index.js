
var xhttp = new XMLHttpRequest();

xhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    var res = JSON.parse(xhttp.responseText);
    if (res.incorrect) {
      document.getElementById("alertLoginFailed").style.visibility = 'visible';
    } else {
      window.location = '/main?user=' + res['user'] + "&k=" + res['k'];
    }
  }
};

function send() {
  document.getElementById("alertLoginFailed").style.visibility = 'hidden';
  xhttp.open("POST", '', true);
  xhttp.setRequestHeader("Content-type", "application/json");
  var body = {  user  : document.getElementById("user").value,
                pin   : document.getElementById("pin").value    };
  console.log(body);
  xhttp.send(JSON.stringify(body));
}
