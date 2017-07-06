const twilio = require('twilio');
const { AccessToken } = twilio.jwt;
const { SyncGrant } = AccessToken;

const { getIdentityFromAddress } = require('../utils/identity');

const {
  TWILIO_API_KEY,
  TWILIO_API_SECRET,
  TWILIO_ACCOUNT_SID,
  TWILIO_NOTIFY_SERVICE,
  TWILIO_SYNC_SERVICE,
  TWILIO_MESSAGING_SERVICE
} = process.env;

const {
  SYNC_NAMES,
  DEFAULT_CONFIGURATION,
  SEGMENTS,
  TAGS
} = require('../../shared/consts');

const restClient = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
  accountSid: TWILIO_ACCOUNT_SID
});

const syncClient = restClient.sync.services(TWILIO_SYNC_SERVICE);
const notifyClient = restClient.notify.services(TWILIO_NOTIFY_SERVICE);
const messagingClient = restClient.messaging.services(TWILIO_MESSAGING_SERVICE);

const orderQueueList = syncClient.syncLists(SYNC_NAMES.ORDER_QUEUE);
const configurationDoc = syncClient.documents(SYNC_NAMES.CONFIGURATION);
const customersMap = syncClient.syncMaps(SYNC_NAMES.CUSTOMERS);
const allOrdersList = syncClient.syncLists(SYNC_NAMES.ALL_ORDERS);

async function registerAddress(address, bindingType) {
  const identity = getIdentityFromAddress(address);
  const endpoint = `${identity}:${bindingType}`;
  const tag = [TAGS.INTERACTED];
  await notifyClient.bindings.create({
    identity,
    address,
    endpoint,
    bindingType,
    tag
  });
  return identity;
}

async function sendMessage(identity, body) {
  const notification = await notifyClient.notifications.create({
    identity: identity,
    body: body
  });
  return notification;
}

async function sendMessageToAll(body) {
  const notification = await notifyClient.notifications.create({
    tag: TAGS.ALL,
    body
  });
  return notification;
}

async function registerOpenOrder(identity) {
  const membership = await notifyClient
    .users(identity)
    .segmentMemberships.create({ segment: SEGMENTS.OPEN_ORDER });
  return membership;
}

async function deregisterOpenOrder(identity) {
  await notifyClient
    .users(identity)
    .segmentMemberships(SEGMENTS.OPEN_ORDER)
    .remove();
  return true;
}

async function sendMessageToAllOpenOrders(body) {
  const notification = await notifyClient.notifications.create({
    segment: SEGMENTS.OPEN_ORDER
  });
  return notification;
}

async function setup() {
  await createResources();
  return setPermissions();
}

async function loadConnectedPhoneNumbers() {
  const phoneNumbers = await messagingClient.phoneNumbers.list();
  const connectedPhoneNumbers = phoneNumbers.map(p => p.phoneNumber).join(', ');
  return connectedPhoneNumbers;
}

function createToken(user) {
  const syncGrant = new SyncGrant({
    serviceSid: TWILIO_SYNC_SERVICE
  });

  const token = new AccessToken(
    TWILIO_ACCOUNT_SID,
    TWILIO_API_KEY,
    TWILIO_API_SECRET
  );
  token.addGrant(syncGrant);
  token.identity = user;
  return token.toJwt();
}

async function setPermissions() {
  const updateOrderQueuePermissions = syncClient
    .syncLists(SYNC_NAMES.ORDER_QUEUE)
    .syncListPermissions('barista')
    .update({
      read: 'true',
      write: 'false',
      manage: 'false'
    });

  const updateOrderQueuePermissionsForAdmin = syncClient
    .syncLists(SYNC_NAMES.ORDER_QUEUE)
    .syncListPermissions('admin')
    .update({
      read: 'true',
      write: 'true',
      manage: 'false'
    });

  const updateAllOrdersPermissionsForAdmin = syncClient
    .syncLists(SYNC_NAMES.ALL_ORDERS)
    .syncListPermissions('admin')
    .update({
      read: 'true',
      write: 'true',
      manage: 'false'
    });

  const updateConfigurationPermissionsForAdmin = syncClient
    .documents(SYNC_NAMES.CONFIGURATION)
    .documentPermissions('admin')
    .update({
      read: 'true',
      write: 'true',
      manage: 'false'
    });

  const updateCustomerPermissionsForAdmin = syncClient
    .syncMaps(SYNC_NAMES.CUSTOMERS)
    .syncMapPermissions('admin')
    .update({
      read: 'true',
      write: 'true',
      manage: 'false'
    });

  return Promise.all([
    updateOrderQueuePermissions,
    updateOrderQueuePermissionsForAdmin,
    updateAllOrdersPermissionsForAdmin,
    updateConfigurationPermissionsForAdmin,
    updateCustomerPermissionsForAdmin
  ]);
}

async function createResources() {
  const createOrderQueue = createIfNotExists(
    syncClient.syncLists,
    SYNC_NAMES.ORDER_QUEUE
  );
  const createConfigurationDoc = createIfNotExists(
    syncClient.documents,
    SYNC_NAMES.CONFIGURATION,
    DEFAULT_CONFIGURATION
  );
  const createCustomerMap = createIfNotExists(
    syncClient.syncMaps,
    SYNC_NAMES.CUSTOMERS
  );
  const createAllOrdersList = createIfNotExists(
    syncClient.syncLists,
    SYNC_NAMES.ALL_ORDERS
  );

  return Promise.all([
    createOrderQueue,
    createConfigurationDoc,
    createCustomerMap,
    createAllOrdersList
  ]);
}

async function createIfNotExists(resource, name, data) {
  const argument = {
    uniqueName: name
  };
  if (data) {
    argument.data = data;
  }
  try {
    return await resource(name).fetch();
  } catch (err) {
    return await resource.create(argument);
  }
}

async function resetList(name) {
  await syncClient.syncLists(name).remove();
  await createIfNotExists(syncClient.syncLists, name);
  return true;
}

module.exports = {
  SYNC_NAMES,
  restClient,
  notifyClient,
  syncClient,
  sendMessage,
  registerAddress,
  messagingClient,
  orderQueueList,
  configurationDoc,
  customersMap,
  allOrdersList,
  setup,
  createToken,
  loadConnectedPhoneNumbers,
  sendMessageToAll,
  sendMessageToAllOpenOrders,
  registerOpenOrder,
  deregisterOpenOrder,
  resetList,
  setPermissions
};
