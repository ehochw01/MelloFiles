console.log("in login.js");
const loginFormHandler = async (event) => {
  console.log("In loginFormHandler");
  event.preventDefault();
  const email = document.querySelector("#email-login").value.trim();
  const password = document.querySelector("#password-login").value.trim();

  if (email && password) {
    const response = await fetch("/api/users/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      headers: { "Content-Type": "application/json" },
    });

    const pendingRating = JSON.parse(sessionStorage.getItem("pendingRating"));
    console.log("pendingRating:", pendingRating);
    sessionStorage.removeItem("pendingRating");
    if (response.ok) {
      if (pendingRating !== null) {
        document.location.replace(`/artist/${pendingRating.artist_id}#${pendingRating.album_id}`);
      } else {
        document.location.replace("/");
      }
    } else {
      alert("Failed to log in.");
    }
  }
};

const signupFormHandler = async (event) => {
  console.log("In signupFormHandler");
  event.preventDefault();
  const username = document.querySelector("#username-signup").value.trim();
  const email = document.querySelector("#email-signup").value.trim();
  const password = document.querySelector("#password-signup").value.trim();

  console.log("username:", username, "email:", email, "password:", password);

  if (username && email && password) {
    const response = await fetch("/api/users", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
      headers: { "Content-Type": "application/json" },
    });
    const resJson = await response.json(); 
    if (response.ok) {
      document.location.replace("/");
    } else {
      if (resJson.errors[0].type == "Validation error") {
        alert("Make sure that your email is correctly formatted and that your password is at elast 6 characters long");
      } else {
        alert("Failed to sign up.");
      }
    }
  }
};

document
  .querySelector("#login-form")
  .addEventListener("submit", loginFormHandler);

document
  .querySelector("#signup-form")
  .addEventListener("submit", signupFormHandler);
