const { safe } = require('../../utils/async-requests');
const { createEventConfig, deleteEventConfig } = require('../../data/config');
const {
  listAllEvents,
  createAllOrdersList,
  createOrderQueue,
  orderQueueList,
  allOrdersList,
} = require('../twilio');
const { SYNC_NAMES } = require('../../../shared/consts');

async function handleCreateEventRequest(req, res, next) {
  const { eventName } = req.body;
  const data = await createEventConfig(eventName);
  const eventId = data.slug;
  await createOrderQueue(eventId);
  await createAllOrdersList(eventId);
  res.send({ eventId });
}

async function handleDeleteEventRequest(req, res, next) {
  const { eventId } = req.params;
  if (!eventId) {
    res.status(404).send({ message: 'Could not find event' });
    return;
  }
  await deleteEventConfig(eventId);
  await allOrdersList(eventId).remove();
  await orderQueueList(eventId).remove();
  res.send({ message: 'Event deleted' });
}

async function handleGetEventsRequest(req, res, next) {
  const events = (await listAllEvents()).map(id =>
    id.substr(SYNC_NAMES.EVENT_CONFIG.length)
  );
  res.send({ events });
}

module.exports = {
  get: safe(handleGetEventsRequest),
  create: safe(handleCreateEventRequest),
  delete: safe(handleDeleteEventRequest),
};
