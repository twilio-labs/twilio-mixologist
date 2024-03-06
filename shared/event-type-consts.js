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
    headerTitle: 'Barista',
    headerIcon: 'coffee-shop-sign',
    defaultProductIcon: 'coffee-to-go',
    productIcons: {
      'Coffee': 'coffee-filter',
      Espresso: 'espresso-maker',
      'Double Espresso': 'espresso-doppio',
      'Espresso Macchiato': 'espresso-macchiato',
      'Flat White': 'flat-white',
      Macchiato: 'latte-macchiato',
      Cappuccino: 'cappuccino',
      Americano: 'americano',
      Matcha: 'jar-of-ground-coffee',
      'Hot Tea': 'cup-of-coffee',
      'Chai': 'flat-white-alternative',
      'Mocha': 'moccacino',
      Latte: 'cafe-latte',
      'Cafe Cubano': 'espresso-alternative',
      'Cafe con Leche': 'cortado',
      'Cortadito': 'flat-white-alternative',
    },
  },
  kiosk: {
    title: 'Thirsty? Coffee?',
    tagLine: 'Make your coffee order ⚡️ asynchronous ⚡️',
  },
};


const SMOOTHIE = {
  iconBasePath: '/assets/smoothie-icons/smoothie-icons_',
  dashboard: {
    headerTitle: 'Smoothie Bar',
    headerIcon: 'blender',
    defaultProductIcon: 'cup',
    productIcons: {
      SendGrid: 'orange',
      Lambada: 'orange',
      Twilio: 'strawberry',
      Colombia: 'strawberry',
      Segment: 'pineapple',
      Smaragd: 'pineapple',
    },
  },
  kiosk: {
    title: 'Thirsty? Smoothie?',
    tagLine: 'Order Smoothies via WhatsApp',
  },
};

export default function get(eventType) {
  if (eventType === 'bartender') {
    return BARTENDER;
  } else if (eventType === 'smoothies') {
    return SMOOTHIES;
  }
  if (eventType === 'smoothie') {
    return SMOOTHIE;
  }
  return BARISTA;
}
