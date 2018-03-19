const { SEGMENTS, DEFAULT_CONFIGURATION } = require('../../../shared/consts');
const { getOrderCancelledMessage } = require('../../utils/messages');
const {
  SYNC_NAMES,
  resetList,
  orderQueueList,
  setPermissions,
  sendMessage,
  notifyClient,
  customersMap,
  configurationDoc,
  allOrdersList,
  resetMap,
  resetNotify,
  loadConnectedPhoneNumbers,
  resetAllLists,
} = require('../twilio');
const { updateGlobalConfigEntry } = require('../../data/config');

async function cancelOpenOrders(eventId) {
  const openOrders = await orderQueueList(eventId).syncListItems.list({
    pageSize: 1000,
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
  await resetList(SYNC_NAMES.ORDER_QUEUE + eventId);
  return setPermissions();
}

async function resetApplication() {
  await resetAllLists(SYNC_NAMES.ORDER_QUEUE);
  await resetAllLists(SYNC_NAMES.ALL_ORDERS);
  await configurationDoc.update({ data: DEFAULT_CONFIGURATION });
  const connectedPhoneNumbers = await loadConnectedPhoneNumbers();
  await updateGlobalConfigEntry('connectedPhoneNumbers', connectedPhoneNumbers);
  await resetMap(SYNC_NAMES.CUSTOMERS);
  await resetNotify();
  await setPermissions();
  return Promise.resolve();
}

async function resetStats(eventId) {
  return resetList(SYNC_NAMES.ALL_ORDERS + eventId);
}

async function handleResetRequest(req, res, next) {
  const { action, eventId } = req.query;
  if (action === 'openOrders') {
    try {
      await cancelOpenOrders(eventId);
      res.send();
    } catch (err) {
      req.log.error(err);
      res.sendStatus(500);
    }
  } else if (action === 'stats') {
    try {
      await resetStats(eventId);
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
