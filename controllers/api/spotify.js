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
    const searchString = req.params.artist.toLowerCase();
    // hard coded to pick most popular result
    const searchArtistData = await spotifyApi.searchArtists(searchString, {limit: 10});
    const artists = searchArtistData.body.artists.items;
    // console.log("artists", artists);
    // console.log("Does artists[0] name match?", artists[0].name.toLowerCase() == searchString);
    var artistId = undefined;
    if (artists[0].name.toLowerCase() == searchString) {
      artistId = artists[0].id;
    } else {
      let matched = false;
      let popularity = 0;
      for (let i=0; i < artists.length; i++) {
        if (artists[i].name.toLowerCase() == searchString) {
          let artist = artists[i];
          // if more than one name match, take the more popular artist
          if (!matched || (matched && artist.popularity > popularity)) {
            artistId = artist.id;
            popularity = artist.popularity;
          }
          matched = true;
        }
      }
    }
    if (artistId === undefined) {
      artistId = artists[0].id;
    }
    res.status(200).json(artistId);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

module.exports = router;

