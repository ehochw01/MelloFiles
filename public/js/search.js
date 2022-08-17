const searchHandler = async (event) => {
    event.preventDefault();  
    const artist = document.querySelector("#srch").value.trim();
    console.log("Artist:", artist);
    
    if (artist) {
      const response = await fetch(`/api/spotify/search/${artist}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
  
      if (response.ok) {
        const artistId = await response.json();
        document.location.replace(`/artist/${artistId}`);
      } else {
        alert("Cannot find artist");
      }
    } else {
        alert("Please enter an artist");
    }
  };

  document
  .querySelector(".search-form")
  .addEventListener("submit", searchHandler);