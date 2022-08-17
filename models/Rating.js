const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

class Rating extends Model {}

module.exports = Rating;

Rating.init(
  {
    // id. Integer, doesn't allow null values, set as primary key uses auto increment
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    // score. Integer, doesn't allow null values, must be between 1 and 10
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        max: 10,                 
        min: 0 
      }
    },
    // album id (from spotify). String. Doesn't allow null values
    album_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // artist id (from spotify). String. Doesn't allow null values
    artist_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // user_id. Integer. Doesn't allow null. Foreign key to user model.
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id',
      }
    },
    review: {
      type: DataTypes.TEXT,
      // can be null
    },
  },
  {
    sequelize,
    freezeTableName: true,
    underscored: true,
    modelName: 'rating',
  }
);