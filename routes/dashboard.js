const moment = require('moment');

const { Order, Source } = require('../models');
const { AVAILABLE_OPTIONS } = require('../data/coffee-options');

function getDashboardData(req, res, next) {
  Order.findAll({
    include: [{ model: Source, attributes: ['name'] }]
  }).then(orders => {
    let totalOrders = {};
    AVAILABLE_OPTIONS.forEach(option => {
      totalOrders[option] = 0;
    });

    let bySource = {
      facebook: 0,
      sms: 0
    };
    let byTime = {
      facebook: Array(24).fill(0),
      sms: Array(24).fill(0)
    };

    orders.forEach(order => {
      totalOrders[order.name]++;
      bySource[order.Source.name]++;
    });

    let todayStart = moment().startOf('day');
    let todayEnd = moment().endOf('day');
    let todaysOrders = orders.filter(order => moment(order.createdAt).isBetween(todayStart, todayEnd));

    todaysOrders.forEach(order => {
      let hour = moment(order.createdAt).hour();
      let source = order.Source.name;
      byTime[source][hour]++;
    });

    res.send({data: { totalOrders, bySource, byTime }});
  });
}

module.exports = getDashboardData;
