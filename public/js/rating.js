// checks if the user has existing scores for any of the rendered albums
const userRatings = document.querySelectorAll('[data-ratingid]');

//
userRatings.forEach(element => {
  const score = element.dataset.userscore;
  element.value = score;
});

const ratingHandler = async (event) => {
  event.preventDefault();
  const ratingSelect = event.target;
  const album_id = ratingSelect.getAttribute("data-albumID");
  const artist_id = ratingSelect.getAttribute("data-aristID");
  const score = ratingSelect.value;
  if (score == "") {
      //delete rating
      return;
  }

  let body = JSON.stringify({ album_id, artist_id, score });
  let response;
  if (typeof(ratingSelect.dataset.ratingid) != "undefined") {
    const ratingID = ratingSelect.dataset.ratingid;
    response = await fetch(`/api/reviews/${ratingID}`, {
      method: "PUT",
      body: body,
      headers: { "Content-Type": "application/json" },
    });
  } else {
    response = await fetch("/api/reviews/", {
      method: "POST",
      body: body,
      headers: { "Content-Type": "application/json" },
    });  
  }
  const resJson = await response.json(); 
  if (resJson == "Log In") {
    document.location.replace("/login");
  } else if (response.ok) {
    document.location.replace(`/artist/${artist_id}`);
  } else {
    alert("Failed to save rating");
  } 
};

var elements = document.getElementsByClassName("album-rating");
for (let i = 0; i < elements.length; i++) {
  elements[i].addEventListener("change", ratingHandler, false);
}