const moment = require('moment');

const { Order, Source } = require('../models');
const { AVAILABLE_OPTIONS } = require('../data/coffee-options');

function getDashboardData(req, res, next) {
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

    orders.forEach(order => {
      ordersByType[order.name]++;
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

    let totalOrders = [];
    for (let type of Object.keys(ordersByType)) {
      totalOrders.push({ name: type, count: ordersByType[type]});
    }

    res.send({data: { totalOrders, bySource, byTime }});
  });
}

module.exports = getDashboardData;
