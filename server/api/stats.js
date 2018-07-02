const { allOrdersList } = require('./twilio');
const { config } = require('../data/config');

function safelyIncrement(item) {
  return (item || 0) + 1;
}

function getAvailableProducts(availableCoffees) {
  const products = {};
  Object.keys(availableCoffees)
    .filter(c => availableCoffees[c])
    .forEach(c => {
      products[c] = 0;
    });
  return products;
}

async function fetchStats(eventId) {
  const {
    expectedOrders,
    availableCoffees,
    visibleNumbers,
    repoUrl,
    mode,
  } = config(eventId);
  const phoneNumbers = visibleNumbers
    .split(',')
    .map(n => n.trim())
    .slice(0, 2);
  const product = getAvailableProducts(availableCoffees);
  const allOrders = await allOrdersList(eventId).syncListItems.list();
  const stats = allOrders.map(order => order.data).reduce(
    (currentStats, order) => {
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
    },
    {
      totalOrders: 0,
      product,
      countryCode: {},
      source: {},
      expectedOrders,
      phoneNumbers,
      repoUrl,
      eventType: mode,
    }
  );
  return stats;
}

async function handler(req, res) {
  const { eventId } = req.query;
  try {
    const stats = await fetchStats(eventId);
    res.send(stats);
  } catch (err) {
    req.log.error(err);
    res.status(500).send('Could not fetch stats. Check logs for information.');
  }
}

module.exports = {
  handler,
  fetchStats,
};
