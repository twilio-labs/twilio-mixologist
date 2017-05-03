const moment = require('moment');

const { Order, Source } = require('../models');
const { AVAILABLE_OPTIONS } = require('../data/coffee-options');

/**
 * Handles GET requests for the Dashboard API
 * 
 * @param {any} req 
 * @param {any} res 
 * @param {any} next 
 */
function getDashboardData(req, res, next) {
  // Find all orders
  Order.findAll({
    include: [{ model: Source, attributes: ['name'] }]
  }).then(orders => {
    let ordersByType = {};
    AVAILABLE_OPTIONS.forEach(option => {
      ordersByType[option] = 0;
    });

    let bySource = {
      facebook: 0,
      sms: 0
    };
    let byTime = {
      facebook: Array(24).fill(0),
      sms: Array(24).fill(0)
    };

    // count orders by source and type
    orders.forEach(order => {
      ordersByType[order.name]++;
      bySource[order.Source.name]++;
    });

    // filter to todays orders
    let todayStart = moment().startOf('day');
    let todayEnd = moment().endOf('day');
    let todaysOrders = orders.filter(order =>
      moment(order.createdAt).isBetween(todayStart, todayEnd)
    );

    // count them by hour
    todaysOrders.forEach(order => {
      let hour = moment(order.createdAt).hour();
      let source = order.Source.name;
      byTime[source][hour]++;
    });

    // change total orders counts into format needed by Dashboard
    let totalOrders = [];
    for (let type of Object.keys(ordersByType)) {
      totalOrders.push({ name: type, count: ordersByType[type] });
    }

    res.send({ data: { totalOrders, bySource, byTime } });
  });
}

module.exports = getDashboardData;
