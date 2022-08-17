const router = require('express').Router();
const { Op } = require("sequelize");
const { User, Rating} = require('../../models');
const withAuth = require('../../utils/auth');



// GET /api/review/:album_id
// Receives a spotify album id
// returns an array of objects with review text, their associated ratings, and usernames who wrote them
router.get('/:album_id', async (req, res) => {
  try {
    console.log("Get Reviews for album");
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
    if (!reviewData) {
      res.status(404).json({ message: 'No Review with this id!'});
      return;
    }
    res.status(200).json(reviewData);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});


// GET /api/review/:user/:album_id
// user_id would passed in via the request object
// returns the id, text body of a review for that album and user
router.get('/user/:album_id', withAuth, async (req, res) => {
  try {
    console.log(`Get Reviews for album by user ${req.session.userID}`);
    const reviewData = await Rating.findOne({
      attributes: [['id','rating_id'],'score', 'review'],
      where: {
        album_id: req.params.album_id,
        user_id: req.session.userID
      },
      include: [{
        model: User,
        attributes: [['id','user_id'], 'username']
      }],
    });
    if (!reviewData) {
      res.status(404).json({ message: 'No Review with this id!'});
      return;
    }
    const review = reviewData.get({ plain: true });
    res.status(200).json(review);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// POST /api/reviews/
// Receives reivew info in the request
// user needs to be logged in
// creates a new review
// needs withAuth middleware to reroute to the login page if the user isn't logged in
router.post('/', withAuth, async (req, res) => {
  try {
    const ratingData = await Rating.create({
      user_id: req.session.userID,
      album_id: req.body.album_id,
      artist_id: req.body.artist_id,
      score: req.body.score,
      review: req.body.review
    });
    console.log(ratingData);
    res.status(200).json(ratingData);
  } catch (err) {
      res.status(500).json(err);
      console.log(err);
  }
});

// PUT /api/reviews/:id
// Receives a rating id, will need to check the user_id and album_id
// checks if the user is logged in
// updates an existing review
// needs withAuth included
router.put('/:id', withAuth, async (req, res) => {
  // update a category by its `id` value
  try {
    const ratingData = await Rating.update(req.body, {
      where: {
        id: req.params.id,
      },
    });
    if (!ratingData[0]) {
      res.status(404).json({ message: 'No Review with this id!'});
      return;
    }
    res.status(200).json(ratingData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// DELETE /api/reviews/:id
// Receives a review id
// user needs to be logged in
// setting a review to null
// needs withAuth middleware to reroute to the login page if the user isn't logged in
router.delete('/:rating_id', withAuth, async (req, res) => {
  // delete one product by its `id` value
  try {
    const reviewData = await Rating.update({ review: null }, {
      where: {
        id: rating_id,
        review: {
          [Op.ne]: null
        }   
      }
    });
    if (!reviewData) {
      res.status(404).json({ message: 'No Review with this Rating_id!'});
      return;
    }
    res.status(200).json(reviewData);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;