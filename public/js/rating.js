const artistLinks = document.querySelectorAll('.artist-link');
var order = localStorage.getItem("albumOrder") || "desc";
console.log("artistLinks", artistLinks);
for(let i=0; i < artistLinks.length; i++) {
  artistLinks[i].href += order;
}
const ascend = document.getElementById("ascending");
const descend = document.getElementById("descending");
console.log(window.location);
if (order == "desc") {
  console.log("currently descending");
  if(window.location.pathname.includes("/desc")) {
    ascend.href = window.location.origin + window.location.pathname.replace("/desc", "/asc") + "#albums";
  } else {
    ascend.href = window.location.origin + window.location.pathname + "asc#albums";
  }
  descend.href = "#albums";
} else {
  console.log("currently ascending");
  if (window.location.pathname.includes("/asc")) {
    descend.href = window.location.origin + window.location.pathname.replace("/asc", "/desc") + "#albums";
  }
  else {
    descend.href = window.location.origin + window.location.pathname + "desc#albums";
  }
  ascend.href = "#albums";
}

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
  console.log("body:", body);
  let response, existing_rating;
  if (typeof(ratingSelect.dataset.ratingid) != "undefined") {
    const ratingID = ratingSelect.dataset.ratingid;
    existing_rating = true;
    response = await fetch(`/api/reviews/${ratingID}`, {
      method: "PUT",
      body: body,
      headers: { "Content-Type": "application/json" },
    });
  } else {
    existing_rating = false;
    response = await fetch("/api/reviews/", {
      method: "POST",
      body: body,
      headers: { "Content-Type": "application/json" },
    });  
  }
  const resJson = await response.json(); 
  if (resJson == "Log In") {
    const rating = {
      artist_id: artist_id,
      album_id: album_id
    };
    sessionStorage.setItem("pendingRating", JSON.stringify(rating));
    document.location.replace("/login");
  } else if (response.ok) {
    location.reload();
  } else {
    alert("Failed to save rating");
  } 
};

var elements = document.getElementsByClassName("album-rating");
for (let i = 0; i < elements.length; i++) {
  elements[i].addEventListener("change", ratingHandler, false);
}

const setOrder = async (e) => {
  const link = e.currentTarget;
  if (link.id == "ascending") {
    localStorage.setItem("albumOrder", "asc");
  } else {
    localStorage.setItem("albumOrder", "desc");
  } 
}

document.getElementById("ascending").addEventListener("click", setOrder, false);
document.getElementById("descending").addEventListener("click", setOrder, false);