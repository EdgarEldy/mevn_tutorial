'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Customer extends Model {}

  Customer.init(
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      first_name: { type: DataTypes.STRING(255), allowNull: true },
      last_name: { type: DataTypes.STRING(255), allowNull: true },
      telephone: { type: DataTypes.STRING(50), allowNull: true },
      email: { type: DataTypes.STRING(255), allowNull: true },
      address: { type: DataTypes.STRING(255), allowNull: true },
    },
    { sequelize, modelName: 'Customer', tableName: 'customers' },
  );

  return Customer;
};
