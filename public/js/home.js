const artistLinks = document.querySelectorAll('.artist-link');
var order = localStorage.getItem("albumOrder");
if (order === null) {
  order = "desc";
  localStorage.setItem("albumOrder", "desc");
}
for(let i=0; i < artistLinks.length; i++) {
  artistLinks[i].href += order;
}

var i = 0;
var txt = '"Writing about music is like dancing about architecture" - Unknown'; /* The text */
var speed = 50; /* The speed/duration of the effect in milliseconds */

function typeWriter() {
  if (i < txt.length) {
    document.getElementById("quote").innerHTML += txt.charAt(i);
    i++;
    setTimeout(typeWriter, speed);
  }
}

window.onload = function () {
    if (sessionStorage.getItem("hasCodeRunBefore") === null) {
        typeWriter();
        sessionStorage.setItem("hasCodeRunBefore", true);
    } else {
        document.getElementById("quote").innerHTML = '"Writing about music is like dancing about architecture" - Unknown';
    }
}
