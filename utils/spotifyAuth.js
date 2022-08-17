var SpotifyWebApi = require('spotify-web-api-node');

const spotifyAuth = async (req, res, next) => {
  if (!req.session.spotify_token || Date.now() > req.session.spotify_token_expires) {
    // should be moved to the .env
    var clientId = process.env.SPOTIFY_CLIENT_ID,
    clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    spotifyApi = new SpotifyWebApi({
      clientId: clientId,
      clientSecret: clientSecret
    });
  
    let data;
    try {
      data = await spotifyApi.clientCredentialsGrant();
      req.session.save(() => {
        req.session.spotify_token = data.body['access_token'];
        req.session.spotify_token_expires = Date.now() + (data.body['expires_in'] * 1000);
        console.log('The access token expires in ' + data.body['expires_in']);
        console.log('The access token is ' + data.body['access_token']);
        next();
    });
    } catch (err) {
      console.log('Something went wrong when retrieving an access token', err);
      res.status(500).json(err);
    }
  } else {
    console.log("Spotify authorization not needed");
    next();
  }
};
  
module.exports = spotifyAuth;