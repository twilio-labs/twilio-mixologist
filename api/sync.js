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

async function handler(req, res, next) {
  res.sendStatus(200);
  if (
    !req.body ||
    !req.body.EventType ||
    req.body.EventType !== 'list_item_updated'
  ) {
    return;
  }
  console.log('Correct event type');

  if (req.body.ListUniqueName !== SYNC_NAMES.ORDER_QUEUE) {
    return;
  }
  console.log('Correct list');

  const itemData = JSON.parse(req.body.ItemData);
  const itemIndex = +req.body.ItemIndex;
  if (itemData.status === 'open') {
    return;
  }
  console.log('Item Data', itemData);

  try {
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
  } catch (err) {
    console.error(err);
  }
}

async function sendMessage(customer, msg) {
  return restClient.messages.create({
    from: customer.contact,
    to: customer.address,
    body: msg
  });
}

module.exports = { handler };
