const router = require('express').Router();
const userRoutes = require('./userRoutes');
const ratingRoutes = require('./ratingRoutes');
const reviewRoutes = require('./reviewRoutes');
const spotifyRoutes = require('./spotify');

router.use('/users', userRoutes);
router.use('/ratings/', ratingRoutes);
router.use('/reviews/', reviewRoutes);


router.use('/spotify/', spotifyRoutes);

module.exports = router;
