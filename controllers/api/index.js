const router = require('express').Router();
const userRoutes = require('./userRoutes');
const ratingRoutes = require('./ratingRoutes');
const reviewRoutes = require('./reviewRoutes');
const musicRoutes = require('./musicbrainz');

router.use('/users', userRoutes);
router.use('/ratings/', ratingRoutes);
router.use('/reviews/', reviewRoutes);
router.use('/music/', musicRoutes);

module.exports = router;
