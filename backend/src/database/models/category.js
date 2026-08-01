'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Category extends Model {}

  Category.init(
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      category_name: { type: DataTypes.STRING(255), allowNull: false },
    },
    { sequelize, modelName: 'Category', tableName: 'categories' },
  );

  return Category;
};
