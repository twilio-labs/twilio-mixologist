const BARTENDER = {
  iconBasePath: '/assets/bartender-icons/bartender-icons_',
  dashboard: {
    headerTitle: 'Bartender Dashboard',
    headerIcon: 'bar-sign',
    defaultProductIcon: 'pilsener',
    productIcons: {
      Beer: 'pilsener',
      'White Wine': 'white-wine',
      'Red Wine': 'red-wine',
    },
  },
  kiosk: {
    title: 'Thirsty? Need a Drink?',
    tagLine: 'Make your drink order ⚡️ asynchronous ⚡️',
  },
};

const BARISTA = {
  iconBasePath: '/assets/barista-icons/barista-icons_',
  dashboard: {
    headerTitle: 'Barista Dashboard',
    headerIcon: 'coffee-shop-sign',
    defaultProductIcon: 'coffee-to-go',
    productIcons: {
      Cappuccino: 'cappuccino',
      Tea: 'cup-of-coffee',
      'Hot Chocolate': 'coffee-to-go',
      'Flat White': 'flat-white',
      Latte: 'cafe-latte',
      Americano: 'americano',
      Mocca: 'coffee-to-go',
      Espresso: 'espresso-maker',
      'Filter Coffee': 'coffee-filter',
    },
  },
  kiosk: {
    title: 'Thirsty? Coffee?',
    tagLine: 'Make your coffee order ⚡️ asynchronous ⚡️',
  },
};

export default function get(eventType) {
  if (eventType === 'bartender') {
    return BARTENDER;
  }
  return BARISTA;
}
