var SpotifyWebApi = require('spotify-web-api-node');
const router = require('express').Router();
const { User, Rating } = require('../models');
const spotifyAuth = require('../utils/spotifyAuth');
const { Op } = require("sequelize");

// GET http://localhost:3001/
router.get('/', spotifyAuth, async (req, res) => {
  console.log("In the home route");
  console.log("req.session.loggedIn:", req.session.loggedIn);
  // get decorative new releases data from spotify and render it
  try {
    const spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET
    });
    spotifyApi.setAccessToken(req.session.spotify_token);
    const newReleaseData = await spotifyApi.getNewReleases({ limit :20, country: 'US' });
    const newReleasesArray = newReleaseData.body.albums.items;
    const newReleases = [];
    // sends new releases to main page
    let i = 0;
    while (newReleases.length < 9 && i < 20) {
      const newRelease = newReleasesArray[i];
      if (newRelease.album_type == "album") {
        const myObj = {
          albumID: newRelease.id,
          albumTitle: newRelease.name,
          spotifyUrl: newRelease.external_urls.spotify,
          artistName: newRelease.artists[0].name,
          artistID: newRelease.artists[0].id,
          albumArtMedium: newRelease.images[1].url,
          albumArtSmall: newRelease.images[2].url,
          releaseDate: newRelease.release_date,
          numTracks: newRelease.total_tracks
        }
        newReleases.push(myObj);
      }
      i++;
    }
    const responseObj = {
      newReleases,
      loggedIn: req.session.loggedIn ? true : false
    }
    // ===========================================================
    // NOTE!!!!! CHANGE TO RES.RENDER WHEN TESTING WITH HANDLEBARS
    // ===========================================================
    // res.status(200).json(responseObj);
    res.render('homepage', responseObj);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// first do GET http://localhost:3001/api/spotify/search/artist_name to get the artist ID
// http://localhost:3001/artist/artist_id
// Receives an artist id
router.get('/artist/:artist_id', spotifyAuth, async (req, res) => {
  console.log("In the artist route");
  console.log("req.session.loggedIn:", req.session.loggedIn);
  try {
    const spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET
    });
     // Save the access token so that it's used in future calls
    spotifyApi.setAccessToken(req.session.spotify_token);
    const artistId = req.params.artist_id;
    // does a GET /v1/artists/{artist_id}/albums request to get album info  
    const albumData = await spotifyApi.getArtistAlbums(artistId ,{include_groups: 'album', market: 'US', limit:'50'});
    // also gives artist ID back
    const albumDataArray = albumData.body.items;


    // hashing each album title to check for potential album duplicates
    // attempts to filter out duplicate albums including deluxe editions, remasters, commentary, etc
    const albumHash = {};

    // console.log(albumDataArray.map(x => x.release_date));
    
    for (let i = 0; i < albumDataArray.length; i++) {
      const album = albumDataArray[i];
      // console.log("album:", album);
      let name = album.name.toLowerCase();
      if (!name.includes("commentary") && !name.includes("karaoke")) {
        name = album.name.replace("The ",'');
        name = name.replace("?",'');
        name = cleanAlbumName(name);
        // if an album doens't match a key in the hashmap, add the album to the hashmap
        if (albumHash[name] === undefined) {
          album.name = cleanAlbumName(album.name);
          albumHash[name] = album;
        // if a version of the album already exists in the hash map, keep the one with the least amount of tracks (it will likely not include bonus tracks which we don't want) 
        } else if (album.total_tracks < albumHash[name].total_tracks) {
          album.name = cleanAlbumName(album.name);
          albumHash[name] = album;
        }
      }
    }
    // console.log(albumHash);
    // now we have a filtered array of albums. Sort it by release year
    const albumArray = Object.values(albumHash).sort((a,b) => parseInt(getReleaseYear(b)) - parseInt(getReleaseYear(a)));
    const artistAlbums = [];
    for (let i = 0; i < albumArray.length; i++) {
      const album = albumArray[i];
      // isValidAlbum attempts to filter out remasters, deluxe editions, etc that duplicate to albums already on the list
      const albumID = album.id;
      // Gets the average rating for each album
      const release_year = getReleaseYear(album);
      const rating = await getAlbumRating(albumID, 1);

      // render the current logged in user's rating if it exists
      let userRating = false;
      if (req.session.loggedIn) {
        // a the logged in user's rating of a current album
        const userID = req.session.userID;
        const ratingData = await Rating.findOne({
          where: {
            album_id: albumID,
            user_id: userID
          }
        });
        if(ratingData){
          userRating = ratingData.get({ plain: true });
          // console.log(userRating);
        }
        
      }
      const myObj = {
        albumID: albumID,
        albumTitle: album.name,
        artistID: album.artists[0].id,
        albumArt: album.images[0].url,
        year: release_year,
        spotifyUrl: album.external_urls.spotify,
        averageRating: rating.average,
        // also return number of votes
        numRatings: rating.numVotes,
        userRating: userRating
      }
      artistAlbums.push(myObj);
    }

    // get artist info
    // Receives a spotify artist_id
    // does a GET /v1/artists/{id} request to get artist info
    const artistData = await spotifyApi.getArtist(artistId);
    spotifyApi.setAccessToken(req.session.spotify_token);
    const artistID = req.params.artist_id;

    const spotifyData = await spotifyApi.getArtistRelatedArtists(artistID);
    let relatedData = spotifyData.body.artists;
    relatedData = relatedData.slice(0, 5);
    const relatedArtists = [];
    for (let i = 0; i < relatedData.length; i++) {
      const myObj = {
        artistId: relatedData[i].id,
        name: relatedData[i].name
      }
      relatedArtists.push(myObj);
    }

    const responseObj = {
      name: artistData.body.name,
      genres: artistData.body.genres,
      artistImage: artistData.body.images[0].url,
      spotifyUrl: artistData.body.external_urls.spotify,
      relatedArtists: relatedArtists,
      albums: artistAlbums,
      loggedIn: req.session.loggedIn ? true : false
    }
    // ===========================================================
    // NOTE!!!!! CHANGE TO RES.RENDER WHEN TESTING WITH HANDLEBARS
    // ===========================================================
    // res.status(200).json(responseObj);
    res.render('artistPage', responseObj);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// http://localhost:3001/album/album_id
// album page route
router.get('/album/:album_id', spotifyAuth, async (req, res) => {
  try {
    const spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });
    spotifyApi.setAccessToken(req.session.spotify_token);

    // may need to get album info from spotify again
    // v1/albums/{id}
    const albumId = req.params.album_id;
    const rawAlbumData = await spotifyApi.getAlbum(albumId, { market: 'US' });
    const rating = await getAlbumRating(albumId, 2);
    const albumData = rawAlbumData.body;
    const trackDataArray = albumData.tracks.items;
    // res.status(200).json(albumData);
    // console.log("trackDataArray:", albumData.tracks);
    const trackArray = [];
    // gather the relevant track info
    for (let i = 0; i < trackDataArray.length; i++) {
      track = trackDataArray[i];
      const myObj = {
        length: millisToMinutesAndSeconds(track.duration_ms),
        name: cleanTrackName(track.name),
        trackNumber: track.track_number,
        spotifyUrl: track.external_urls.spotify
      }
      trackArray.push(myObj);
    }

    // get the logged in user's review of the album if it exists
    let userReview = null;
    if (req.session.loggedIn) {
      const reviewData = await Rating.findOne({
        attributes: [['id','rating_id'],'score', 'review'],
        where: {
          album_id: albumId,
          user_id: req.session.userID
        },
        include: [{
          model: User,
          attributes: [['id','user_id'], 'username']
        }],
      });
      if (reviewData !== null) {
        userReview = reviewData.get({ plain: true });
      } 
    }

    const artistData = [];

    albumData.artists.forEach(artist => {
      let myObj = {};
      myObj.name = artist.name;
      myObj.id = artist.id;
      artistData.push(myObj);
    });

    const albumInfo = {
      albumID: albumData.id,
      albumTitle: cleanAlbumName(albumData.name),
      spotifyUrl: albumData.external_urls.spotify,
      artistID: albumData.artists[0].id,
      albumArt: albumData.images[0].url,
      albumArtMedium: albumData.images[1].url,
      releaseDate: new Date(albumData.release_date).toLocaleDateString(),
      numTracks: albumData.total_tracks,
      label: albumData.label
    }
    // get the reviews for the album
    // Receives a spotify album id
    // returns an array of objects with review text, their associated ratings, and usernames who wrote them
    const reviewData = await Rating.findAll({
      attributes: [['id','rating_id'],'score', 'review'],
      where: {
        album_id: req.params.album_id,   
        // only gets rating objects with reviews
        review: {
          [Op.ne]: null
        }   
      },
      include: [{
        model: User,
        attributes: [['id','user_id'], 'username']
      }],
    });

    const reviews = reviewData.map(review => review.get({plain: true}));
    console.log('reviews:', reviews);
    const responseObj = {
      albumInfo: albumInfo,
      averageRating: rating.average,
      numVotes: rating.numVotes,
      artists: artistData,
      tracks: trackArray,
      reviews: reviews,
      loggedIn: req.session.loggedIn ? true : false,
      userReview: userReview
    }

    // ===========================================================
    // NOTE!!!!! CHANGE TO RES.RENDER WHEN TESTING WITH HANDLEBARS
    // ===========================================================
    // res.status(200).json(responseObj);
    res.render('albumPage', responseObj);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

function millisToMinutesAndSeconds(millis) {
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

async function getAlbumRating(albumID, decPlace) {
  const scoreData = await Rating.findAll({
    attributes: ['score'],
    where: {
      // Receives a spotify album id
      album_id: albumID
    }
  });
  let numScores = scoreData.length;
  var average = null;
  if (scoreData.length > 0) {
    average = getAverageScore(scoreData.map((score) => score.score), decPlace);
  } 
  return {
    numVotes: numScores,
    average: average
  }
}

function getAverageScore(scores, decPlace) {
  let total = 0;
  for(let i = 0; i < scores.length; i++) {
    total += scores[i];
  }
  const rawAvg = total / scores.length;
  // returns the average score of that album
  return Math.round(rawAvg * (10*decPlace)) / (10*decPlace);
}

function cleanTrackName(track) {
  track = track.replace(" (Remastered)", "");
  track = track.split(" - Remaster")[0];
  return track;
}

function cleanAlbumName(name) {
  var temp = name.split(" [")[0];
  name = temp.split(" (")[0];
  return name;
}

function getReleaseYear(album) {
  return album.release_date_precision === 'year'
        ? album.release_date
        : album.release_date.split('-')[0];
}

router.get('/login', (req, res) => {
  // if we go to login and we are already logged in we get redirected to home
  if (req.session.loggedIn) {
    res.redirect('/');
    return;
  }

  res.render('login', {
    loggedIn: req.session.loggedIn ? true : false
  });
});

router.get('')

module.exports = router;
