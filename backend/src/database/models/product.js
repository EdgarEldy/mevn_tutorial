'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      Product.belongsTo(models.Category, { foreignKey: 'category_id', as: 'category' });
    }
  }

  Product.init(
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      category_id: { type: DataTypes.BIGINT, allowNull: false },
      product_name: { type: DataTypes.STRING(255), allowNull: false },
      unit_price: { type: DataTypes.FLOAT, allowNull: false },
    },
    { sequelize, modelName: 'Product', tableName: 'products' },
  );

  return Product;
};
