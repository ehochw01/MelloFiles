const sequelize = require('../config/connection');
const { User, Rating } = require('../models');

const userData = require('./userData.json');
const ratingData = require('./ratingData.json');

const seedUsers = async () => {
  await sequelize.sync({ force: true });

  await User.bulkCreate(userData, {
    individualHooks: true,
    returning: true,
  });

  await seedRatings();

  process.exit(0);
};

const seedRatings = async () => {
  console.log("seedRatings()");
  await Rating.bulkCreate(ratingData);
}

seedUsers();
