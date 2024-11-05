export interface MenuItem {
  shortTitle: string;
  title: string;
  description: string;
}

export enum modes {
  barista = "barista",
  smoothie = "smoothie",
}

export type Menus = {
  [key in modes]: {
    items: MenuItem[];
    modifiers?: string[];
  };
};

export interface Order {
  key: string;
  manual?: boolean;
  item: MenuItem;
  modifiers?: string;
  address?: string;
  orderNumber?: number;
  originalText?: string;
  status: "queued" | "cancelled" | "ready" | "delivered";
  reminded?: true;
}

export default {
  barista: {
    items: [
      {
        shortTitle: "Coffee",
        title: "Coffee",
        description: "Brewed coffee, black",
      },
      {
        shortTitle: "Espresso",
        title: "Espresso",
        description: "Strong black coffee",
      },
      {
        shortTitle: "Double Espresso",
        title: "Double Espresso",
        description: "Double shot of espresso",
      },
      {
        shortTitle: "Flat White",
        title: "Flat White",
        description: "Espresso with velvety milk",
      },
      {
        shortTitle: "Macchiato",
        title: "Macchiato",
        description: 'Espresso "stained" with a splash of milk',
      },
      {
        shortTitle: "Double Macchiato",
        title: "Double Macchiato",
        description: "Two shots of espresso marked with milk",
      },
      {
        shortTitle: "Latte Macchiato",
        title: "Latte Macchiato",
        description: "Milk marked with espresso",
      },
      {
        shortTitle: "Iced Latte",
        title: "Iced Latte",
        description: "Espresso with cold milk and ice",
      },
      {
        shortTitle: "Caffè Latte",
        title: "Caffè Latte",
        description: "Espresso with steamed milk",
      },
      {
        shortTitle: "Cappuccino",
        title: "Cappuccino",
        description: "Espresso with steamed milk",
      },
      {
        shortTitle: "British Breakfast Tea",
        title: "British Breakfast Tea",
        description: "Blend of black teas",
      },
      {
        shortTitle: "Espresso Macchiato",
        title: "Espresso Macchiato",
        description: "Espresso with a dash of milk",
      },
      {
        shortTitle: "Americano",
        title: "Americano",
        description: "Espresso with hot water",
      },
      {
        shortTitle: "Iced Americano",
        title: "Iced Americano",
        description: "Espresso shots with cold water and ice.",
      },
      {
        shortTitle: "Matcha",
        title: "Matcha",
        description:
          "Powder made from ground-up green tea leaves brewed into tea.",
      },
      {
        shortTitle: "Mocha",
        title: "Caffè Mocha",
        description: "Chocolate-flavoured variant of a caffè latte",
      },
      {
        shortTitle: "Black Tea",
        title: "Black Tea",
        description: "Robust, bold, energizing, classic, versatile, comforting",
      },
      {
        shortTitle: "Herbal Tea",
        title: "Herbal Tea",
        description: "Classic, diverse, hot beverage infused with leaves",
      },
      {
        shortTitle: "Apple Chamomile",
        title: "Apple Chamomile",
        description: "Apple and chamomile tea",
      },
      {
        shortTitle: "Earl Grey",
        title: "Earl Grey",
        description: "Blend of black tea scented with oil of bergamot",
      },
      {
        shortTitle: "Chai",
        title: "Chai",
        description: "Spiced tea with milk",
      },
      {
        shortTitle: "Chocolate",
        title: "Hot Chocolate",
        description: "Hot cocoa",
      },
    ],
    modifiers: [
      "Milk",
      "Soy Milk",
      "Almond Milk",
      "Oat Milk",
      "Coconut Milk",
      "Rice Milk",
      "Vanilla Syrup",
      "Chocolate Caramel Syrup",
      "Hazelnut Syrup",
      "Brown Sugar Stick",
      "White Sugar Stick",
    ],
  },
  smoothie: {
    items: [
      {
        title: "Colombia (Red like Twilio!)",
        shortTitle: "Colombia",
        description: "Strawberry, Pineapple, Apple, Sunflower Seeds 🍓🍍🍏🌻",
      },
      {
        title: "Aquamarine (Blue like SendGrid!)",
        shortTitle: "Aquamarine",
        description:
          "Pineapple, Banana, Coconut Milk, Dates, Flaxseed 🍍🍌🥥🌴",
      },
      {
        title: "Lambada (Green like Segment!)",
        shortTitle: "Lambada",
        description:
          "Orange, Mango, Banana, Passion Fruit, Flaxseed, Coconut Oil 🍊🥭🍌🥥",
      },
    ],
  },
} as Menus;
