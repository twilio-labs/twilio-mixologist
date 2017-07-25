const { allOrdersList } = require('./twilio');
const { config } = require('../data/config');

async function handler(req, res, next) {
  const stats = {
    totalOrders: 0,
    product: {},
    countryCode: {}
  };
  try {
    const allOrders = await allOrdersList.syncListItems.list();
    const stats = allOrders.map(order => order.data).reduce((
      currentStats,
      order
    ) => {
      currentStats.totalOrders++;
      currentStats.source[order.source] = safelyIncrement(
        currentStats.source[order.source]
      );
      currentStats.product[order.product] = safelyIncrement(
        currentStats.product[order.product]
      );
      currentStats.countryCode[order.countryCode] = safelyIncrement(
        currentStats.countryCode[order.countryCode]
      );
      return currentStats;
    }, { totalOrders: 0, product: {}, countryCode: {}, source: {} });
    res.send(stats);
  } catch (err) {
    req.log.error(err);
    res.status(500).send('Could not fetch stats. Check logs for information.');
  }
}

function safelyIncrement(item) {
  return (item || 0) + 1;
}

module.exports = {
  handler: handler
};
