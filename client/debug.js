import { SyncClient } from 'twilio-sync';

var client;

window.orderQueueList = undefined;
window.configurationDoc = undefined;
window.customersMap = undefined;
window.allOrdersList = undefined;

fetch('/api/token', {
  credentials: 'include'
})
  .then(resp => resp.json())
  .then(({ token }) => {
    console.log(token);
    client = new SyncClient(token);
    return client;
  })
  .then(client => {
    clientConnected();
  })
  .catch(err => console.error(err));

function clientConnected() {
  client.document('configuration').then(doc => {
    window.configurationDoc = doc;
    setData('configuration', doc.value);
    window.configurationDoc.on('updated', data => {
      setData('configuration', data);
    });
  });

  client.list('orderQueue').then(list => {
    window.orderQueueList = list;
    displayAllItems('orderQueue', window.orderQueueList);
    window.orderQueueList.on('itemAdded', () =>
      displayAllItems('orderQueue', window.orderQueueList)
    );
    window.orderQueueList.on('itemRemoved', () =>
      displayAllItems('orderQueue', window.orderQueueList)
    );
    window.orderQueueList.on('itemUpdated', () =>
      displayAllItems('orderQueue', window.orderQueueList)
    );
  });

  client.list('allOrders').then(list => {
    window.allOrdersList = list;
    displayAllItems('allOrders', window.allOrdersList);
    window.allOrdersList.on('itemAdded', () =>
      displayAllItems('allOrders', window.allOrdersList)
    );
    window.allOrdersList.on('itemRemoved', () =>
      displayAllItems('allOrders', window.allOrdersList)
    );
    window.allOrdersList.on('itemUpdated', () =>
      displayAllItems('allOrders', window.allOrdersList)
    );
  });

  client.map('customers').then(map => {
    window.customersMap = map;
    displayAllItems('customers', window.customersMap);
    window.customersMap.on('itemAdded', () =>
      displayAllItems('customers', window.customersMap)
    );
    window.customersMap.on('itemRemoved', () =>
      displayAllItems('customers', window.customersMap)
    );
    window.customersMap.on('itemUpdated', () =>
      displayAllItems('customers', window.customersMap)
    );
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
