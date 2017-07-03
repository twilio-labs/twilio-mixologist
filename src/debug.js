var client;

var orderQueue;
var configuration;
var customers;
var allOrders;

fetch('/api/token', {
  credentials: 'include'
})
  .then(resp => resp.json())
  .then(({ token }) => {
    console.log(token);
    client = new Twilio.Sync.Client(token);
    return client;
  })
  .then(client => {
    clientConnected();
  })
  .catch(err => console.error(err));

function clientConnected() {
  client.document('configuration').then(doc => {
    configuration = doc;
    setData('configuration', doc.value);
    configuration.on('updated', data => {
      setData('configuration', data);
    });
  });

  client.list('orderQueue').then(list => {
    orderQueue = list;
    displayAllItems('orderQueue', orderQueue);
    orderQueue.on('itemAdded', () => displayAllItems('orderQueue', orderQueue));
    orderQueue.on('itemRemoved', () =>
      displayAllItems('orderQueue', orderQueue)
    );
    orderQueue.on('itemUpdated', () =>
      displayAllItems('orderQueue', orderQueue)
    );
  });

  client.list('allOrders').then(list => {
    allOrders = list;
    displayAllItems('allOrders', allOrders);
    allOrders.on('itemAdded', () => displayAllItems('allOrders', allOrders));
    allOrders.on('itemRemoved', () => displayAllItems('allOrders', allOrders));
    allOrders.on('itemUpdated', () => displayAllItems('allOrders', allOrders));
  });

  client.map('customers').then(map => {
    customers = map;
    displayAllItems('customers', customers);
    customers.on('itemAdded', () => displayAllItems('customers', customers));
    customers.on('itemRemoved', () => displayAllItems('customers', customers));
    customers.on('itemUpdated', () => displayAllItems('customers', customers));
  });
}

function setData(name, data) {
  document.querySelector(`#${name}`).innerText = JSON.stringify(
    data,
    undefined,
    2
  );
}

function displayAllItems(name, list) {
  return list.getItems({ pageSize: 1000 }).then(page => {
    setData(name, page.items);
  });
}
