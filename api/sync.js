const {
  SYNC_NAMES,
  customersMap,
  orderQueueList,
  restClient
} = require('./twilio');

const {
  getOrderCancelledMessage,
  getOrderReadyMessage
} = require('../utils/messages');

const { setConfig } = require('../data/config');

async function handler(req, res, next) {
  res.sendStatus(200);
  if (!req.body || !req.body.EventType || !validEventType(req.body.EventType)) {
    return;
  }
  console.log('Correct event type');

  try {
    if (isDocumentUpdate(req.body.EventType)) {
      await updateConfiguration(req.body);
    } else {
      if (req.body.ListUniqueName !== SYNC_NAMES.ORDER_QUEUE) {
        return;
      }

      console.log('Correct list');
      await handleOrderStatusChange(req.body);
    }
  } catch (err) {
    console.error(err);
  }
}

async function handleOrderStatusChange(requestBody) {
  const itemData = JSON.parse(requestBody.ItemData);
  const itemIndex = +requestBody.ItemIndex;
  if (itemData.status === 'open') {
    return;
  }
  console.log('Item Data', itemData);

  const customer = await customersMap.syncMapItems(itemData.customer).fetch();
  const indexOfOrder = customer.data.openOrders.indexOf(itemIndex);
  customer.data.openOrders.splice(indexOfOrder, 1);
  await customersMap.syncMapItems(customer.key).update({
    data: customer.data
  });

  let responseMessage;
  if (itemData.status === 'ready') {
    responseMessage = getOrderReadyMessage(itemData.product, itemIndex);
  } else {
    responseMessage = getOrderCancelledMessage(itemData.product, itemIndex);
  }
  await sendMessage(customer.data, responseMessage);

  await orderQueueList.syncListItems(itemIndex).remove();
  return;
}

async function sendMessage(customer, msg) {
  return restClient.messages.create({
    from: customer.contact,
    to: customer.address,
    body: msg
  });
}

function validEventType(eventType) {
  return eventType === 'list_item_updated' || isDocumentUpdate(eventType);
}

function isDocumentUpdate(eventType) {
  return eventType === 'document_created' || eventType === 'document_updated';
}

function updateConfiguration(requestBody) {
  const newConfig = JSON.parse(requestBody.DocumentData);
  setConfig(newConfig);
}

module.exports = { handler };
