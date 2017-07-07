const { SEGMENTS } = require('../../../shared/consts');
const { getOrderCancelledMessage } = require('../../utils/messages');
const {
  SYNC_NAMES,
  resetList,
  orderQueueList,
  setPermissions,
  sendMessage,
  notifyClient,
  customersMap
} = require('../twilio');

async function cancelOpenOrders() {
  const openOrders = await orderQueueList.syncListItems.list({
    pageSize: 1000
  });
  const closeAllOpenOrders = openOrders.map(async order => {
    const customerId = order.data.customer;
    const { product } = order.data;
    const orderNumber = order.index;
    const msg = getOrderCancelledMessage(product, orderNumber);
    await sendMessage(customerId, msg);
    await notifyClient
      .users(customerId)
      .segmentMemberships(SEGMENTS.OPEN_ORDER)
      .remove();
    const { data } = await customersMap.syncMapItems(customerId).fetch();
    data.openOrders = [];
    return customersMap.syncMapItems(customerId).update({ data });
  });
  await Promise.all(closeAllOpenOrders);
  await resetList(SYNC_NAMES.ORDER_QUEUE);
  return setPermissions();
}

async function resetApplication() {
  // TODO
  return Promise.resolve();
}

async function handleResetRequest(req, res, next) {
  const { action } = req.query;
  if (action === 'openOrders') {
    try {
      await cancelOpenOrders();
      res.send();
    } catch (err) {
      req.log.error(err);
      res.sendStatus(500);
    }
  } else if (action === 'resetApplication') {
    try {
      await resetApplication();
      res.send();
    } catch (err) {
      req.log.error(err);
      res.sendStatus(500);
    }
  } else {
    res.sendStatus(400);
  }
}

module.exports = { handler: handleResetRequest };
