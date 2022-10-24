var SpotifyWebApi = require('spotify-web-api-node');
const router = require('express').Router();
const spotifyAuth = require('../../utils/spotifyAuth');

// GET /api/spotify/search/:artist
// does a GET /v1/search search query to spotify to get the artist_id
router.get('/search/:artist', spotifyAuth, async (req, res) => {
  try {
    const spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });
     // Save the access token so that it's used in future calls
    spotifyApi.setAccessToken(req.session.spotify_token);
    const searchString = req.params.artist;
    // hard coded to pick most popular result
    const searchArtistData = await spotifyApi.searchArtists(searchString, {limit: 10});
    const artists = searchArtistData.body.artists.items;
    // console.log("artists", artists);
    // console.log("Does the name match?", artists[1].name == searchString);
    var artistId = artists[0].id;
    // if there is a tie for popularity
    if (artists[0].popularity == artists[1].popularity) {
      for (let i=0; i < artists.length; i++) {
        if (artists[i].name == searchString) {
          artistId = artists[i].id;
        }
      }

    } 
    res.status(200).json(artistId);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

module.exports = router;

