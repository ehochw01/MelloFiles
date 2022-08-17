const Sequelize = require('sequelize');
require('dotenv').config();

let sequelize;

// We will need to add the JAWSDB addon in heroku to make our database accessible to heroku. This requires a credit card entered but is a free feature.
if (process.env.JAWSDB_URL) {
  sequelize = new Sequelize(process.env.JAWSDB_URL);
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: 'localhost',
      dialect: 'mysql',
      port: 3306
    }
  );
}

module.exports = sequelize;