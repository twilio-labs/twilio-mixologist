const { safe } = require('../../utils/async-requests');
const { createEventConfig, deleteEventConfig } = require('../../data/config');
const { listAllEvents } = require('../twilio');

async function handleCreateEventRequest(req, res, next) {
  const { eventName } = req.body;
  const data = await createEventConfig(eventName);
  res.send({ eventId: data.slug });
}

async function handleDeleteEventRequest(req, res, next) {
  const { eventId } = req.param;
  if (!eventId) {
    res.status(404).send({ message: 'Could not find event' });
    return;
  }
  await deleteEventConfig(eventId);
  res.send({ message: 'Event deleted' });
}

async function handleGetEventsRequest(req, res, next) {
  const events = await listAllEvents();
  res.send({ events });
}

module.exports = {
  get: safe(handleGetEventsRequest),
  create: safe(handleCreateEventRequest),
  delete: safe(handleDeleteEventRequest)
};
