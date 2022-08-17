const router = require('express').Router();
const { User, Rating } = require('../../models');
const withAuth = require('../../utils/auth');


// GET /api/rating/average/:album_id
// Receives a spotify album id
// returns the average score of that album
// req.params.album_id
router.get('/average/:album_id', async (req, res) => {
  try {
    console.log("Get Ratings for album");
    const scoreData = await Rating.findAll({
      attributes: ['score'],
      where: {
        album_id: req.params.album_id
      }
    });
    let scores = scoreData.map((score) => score.score);
    let total = 0;
    for(let i = 0; i < scores.length; i++) {
      total += scores[i];
    }
    const rawAvg = total / scores.length;
    const average = Math.round(rawAvg * 10) / 10
    // also return number of votes
    res.status(200).json(average);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// // GET /api/rating/:user_id/:album_id
// Receives a spotify album id, and user_id through the req body
// uses findOne
// returns rating object for the one album, excluding the review
// req.params.album_id
router.get('/user/:album_id', withAuth, async (req, res) => {
  try {
    console.log("Get Ratings for album");
    const ratingData = await Rating.findOne({
      attributes: {exclude: ['review']},
      where: {
        album_id: req.params.album_id,
        user_id: req.session.userID
      }
    });
    if (!ratingData) {
      res.status(404).json({ message: 'No Rating with this id!'});
      return;
    }
    const rating = ratingData.get({ plain: true });
    res.status(200).json(rating);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// POST /api/ratings/
// Receives rating info in the request
// checks if the user is logged in
// creates a new rating
// needs withAuth included
router.post('/', withAuth, async (req, res) => {
  try {
    const ratingData = await Rating.create({
      user_id: req.session.userID,
      album_id: req.body.album_id,
      artist_id: req.body.artist_id,
      score: req.body.score
    });
    console.log(ratingData);
    res.status(200).json(ratingData);
  } catch (err) {
      res.status(500).json(err);
      console.log(err);
  }
});


// PUT /api/rating/:id
// Receives a rating id, will need to check the user_id and album_id
// checks if the user is logged in
// updates an existing rating
// needs withAuth included
router.put('/:id', withAuth, async (req, res) => {
  // update a category by its `id` value
  try {
    const ratingData = await Rating.update(req.body, {
      attributes: {exclude: ['review']},
      where: {
        id: req.params.id,
      },
    });
    if (!ratingData[0]) {
      res.status(404).json({ message: 'No Rating with this id!'});
      return;
    }
    res.status(200).json(ratingData);
  } catch (err) {
    res.status(500).json(err);
  }
});



module.exports = router;

// this may need to be done in another file, using spotify routes

