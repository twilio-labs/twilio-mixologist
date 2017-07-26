const { allOrdersList } = require('./twilio');
const { config } = require('../data/config');

async function handler(req, res, next) {
  const {
    expectedOrders,
    availableCoffees,
    connectedPhoneNumbers,
    repoUrl
  } = config();
  const phoneNumbers = connectedPhoneNumbers
    .split(',')
    .map(n => n.trim())
    .slice(0, 2);
  const product = getAvailableProducts(availableCoffees);
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
    }, {
      totalOrders: 0,
      product,
      countryCode: {},
      source: {},
      expectedOrders,
      phoneNumbers,
      repoUrl
    });
    res.send(stats);
  } catch (err) {
    req.log.error(err);
    res.status(500).send('Could not fetch stats. Check logs for information.');
  }
}

function safelyIncrement(item) {
  return (item || 0) + 1;
}

function getAvailableProducts(availableCoffees) {
  const products = {};
  Object.keys(availableCoffees).filter(c => availableCoffees[c]).forEach(c => {
    products[c] = 0;
  });
  return products;
}

module.exports = {
  handler: handler
};
