'use strict';
module.exports = function(sequelize, DataTypes) {
  var Order = sequelize.define('Order', {
    name: DataTypes.STRING,
    fulfilled: DataTypes.BOOLEAN
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
        Order.belongsTo(models.Source);
      }
    }
  });
  return Order;
};