const { DEFAULT_CONFIGURATION } = require('../../../shared/consts');
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
  resetMap,
  resetNotify,
  loadConnectedPhoneNumbers,
  resetAllLists,
  deregisterOpenOrder,
  removeAllEventConfigs,
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
    const { data } = await customersMap.syncMapItems(customerId).fetch();
    const newBindingSid = await deregisterOpenOrder(data.bindingSid);
    data.openOrders = [];
    data.bindingSid = newBindingSid;
    return customersMap.syncMapItems(customerId).update({ data });
  });
  await Promise.all(closeAllOpenOrders);
  await resetList(SYNC_NAMES.ORDER_QUEUE + eventId);
  return setPermissions();
}

async function resetApplication() {
  await resetAllLists(SYNC_NAMES.ORDER_QUEUE);
  await resetAllLists(SYNC_NAMES.ALL_ORDERS);
  await removeAllEventConfigs();
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

async function handleResetRequest(req, res) {
  const { action, eventId } = req.query;
  if (action === 'openOrders') {
    if (!eventId) {
      res.status(400).send('Missing eventId');
      return;
    }

    try {
      await cancelOpenOrders(eventId);
      res.send();
    } catch (err) {
      req.log.error(err);
      res.sendStatus(500);
    }
  } else if (action === 'stats') {
    if (!eventId) {
      req.status(400).send('Missing eventId');
      return;
    }

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
