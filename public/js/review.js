const ratingSelect = document.getElementById('rating');
const reviewForm = document.getElementById('review-form')

if (typeof(ratingSelect.dataset.ratingid) != "undefined") {
  const score = ratingSelect.dataset.userscore;
  ratingSelect.value = score;
}

const reviewHandler = async (event) => {
  event.preventDefault();
  const album_id = ratingSelect.getAttribute("data-albumID");
  const artist_id = ratingSelect.getAttribute("data-aristID");
  const score = ratingSelect.value;
  let review = document.getElementById("review-text").value;
  if (score == "") {
      //delete rating
      alert("You must select a rating");
      location.reload();
  }

  if (review == "") {
    review = null;
  }
  let body = JSON.stringify({ album_id, artist_id, score, review });
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
    location.reload();;
  } else {
    alert("Failed to save rating");
  } 
};

reviewForm.addEventListener("submit", reviewHandler);