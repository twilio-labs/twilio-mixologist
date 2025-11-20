export interface MenuItem {
  shortTitle: string;
  title: string;
  description: string;
}

export enum modes {
  barista = "barista",
  smoothie = "smoothie",
  cocktail = "cocktail",
  tea = "tea",
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
  item: string;
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
      // { disable and prefer Caffè Latte to avoid confusion
      //   shortTitle: "Latte Macchiato",
      //   title: "Latte Macchiato",
      //   description: "Milk marked with espresso",
      // },
      {
        shortTitle: "Iced Latte",
        title: "Iced Latte",
        description: "Espresso with cold milk and ice",
      },
      {
        shortTitle: "Latte",
        title: "Latte",
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
        shortTitle: "Hot Chocolate",
        title: "Hot Chocolate",
        description: "Steamed milk with chocolate syrup",
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
        shortTitle: "SMS Espresso",
        title: "SMS Espresso",
        description: "Shot of Espresso",
      },
      {
        shortTitle: "Cloud Cappuccino",
        title: "Cloud Cappuccino",
        description: "Made with espresso, steamed milk and milk foam",
      },
      {
        shortTitle: "Twilio Latte",
        title: "Twilio Latte",
        description:
          "Shot of espresso and steamed milk, topped with a thin layer of milk foam",
      },
      {
        shortTitle: "Money Macchiato",
        title: "Money Macchiato",
        description: "An espresso and small amount of milk",
      },
      {
        shortTitle: "Café Colada",
        title: "Café Colada",
        description: "Hand brewed Coffee + Turbinado Sugar",
      },
      {
        shortTitle: "Cortadito",
        title: "Cortadito",
        description: "Espresso + Steamed Milk + Blended Sugar",
      },
      {
        shortTitle: "Cortado",
        title: "Cortado",
        description: "One Shot of Espresso + Dash Steamed Milk",
      },
      {
        shortTitle: "Caramelo Cortado",
        title: "Caramelo Cortado",
        description: "Espresso + Sweet Milk + Caramel",
      },
      {
        shortTitle: "Café Con Leche",
        title: "Café Con Leche",
        description: "Espresso + Steamed Milk + Sugar Blended.",
      },
      {
        shortTitle: "Café Dulce",
        title: "Café Dulce",
        description: "Espresso + Sweet Condensed Milk",
      },
      {
        shortTitle: "Café Coco",
        title: "Café Coco",
        description: "Espresso + Coconut milk",
      },
      {
        shortTitle: "Con Sabor",
        title: "Con Sabor",
        description: "Choice of Flavored Syrup Infused Into Any of The Above",
      },

      {
        shortTitle: "Matcha Latte",
        title: "Matcha Latte",
        description:
          "Green tea whisked into steamed milk",
      },
      {
        shortTitle: "Chai Latte",
        title: "Chai Latte",
        description: "Spiced Tea with steamed Milk",
      },
      {
        shortTitle: "Matcha Green Tea",
        title: "Matcha Green Tea",
        description:
          "Matcha Green Tea, Honey, Cashew Milk, Frozen Grape Ice Cubes & Honeycomb",
      },
      {
        shortTitle: "Cucumber Juice",
        title: "Cucumber Juice",
        description:
          "Cucumber Juice, Wildflower Honey, Parsley, Pellegrino, mint-garnished",
      },
    ],
    modifiers: [
      "Decaf",
      "Milk",
      "Soy Milk",
      "Almond Milk",
      "Oat Milk",
      "Semi-skimmed Milk",
      "Coconut Milk",
      "Rice Milk",
      "Sugarfree Vanilla Syrup",
      "Chocolate Caramel Syrup",
      "Vanilla Syrup",
      "Chocolate Syrup",
      "Caramel Syrup",
      "Hazelnut Syrup",
      "Cinnamon Syrup",
      "Coconut Syrup",
      "Mint Syrup",
      "Dulce de leche Syrup",
      "Café de Olla Syrup",
      "Chocolate Sauce",
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
      {
        title: "Macarena",
        shortTitle: "Macarena",
        description: "Fruity 🍓🍍🍏 mix with exotic notes",
      },
      {
        title: "La Isla Bonita",
        shortTitle: "La Isla Bonita",
        description: "Creamy 🍍🍌🥥 with a blue twist 💙",
      },
      {
        title: "Des.pa.cito",
        shortTitle: "Des.pa.cito",
        description: "Green 🍏🍌🌿 with citrus zing 🍋",
      },
    ],
  },
  tea: {
    items: [
      {
        title: "Mango Black Tea with Boba",
        shortTitle: "Mango Black Tea",
        description: "Mango, Cane Sugar, Assam Black Tea, Boba 🥭🧋",
      },
      {
        title: "Lychee Peachy Green Tea with Lychee Jelly",
        shortTitle: "Lychee Peachy Tea",
        description: "Lychee, Peach, Jasmine Green Tea, Lychee Jelly 🍑🍵",
      },
      {
        title: "Caramel Milk Tea",
        shortTitle: "Caramel Milk Tea",
        description: "Caramel, Oatmilk, Assam Black Tea 🍯🥛",
      },
    ],
  },
  cocktail: {
    items: [
      {
        title: "The SMSpresso - Espresso Martini",
        shortTitle: "Espresso Martini",
        description: "Vodka, Espresso, Coffee Liqueur, Sugar Syrup",
      },
      {
        title: "The Cloud Coffee - White Russian",
        shortTitle: "White Russian",
        description: "Vodka, Coffee Liqueur, Cream",
      },
      {
        title: "The Twilio Roast - Irish Coffee",
        shortTitle: "Irish Coffee",
        description: "Whiskey, Coffee, Cream",
      },
      {
        title: "The API Pour - Mudslide",
        shortTitle: "Mudslide",
        description: "Vodka, Coffee Liqueur, Irish Cream, Cream",
      },
      {
        shortTitle: "Espresso Martini",
        description: "Vodka, Espresso, Coffee Liqueur, Sugar Syrup",
        title: "Espresso Martini",
      },
      {
        title: "Maracuia Fitzgerald",
        shortTitle: "Maracuia Fitzgerald",
        description:
          "Gin, limão siciliano e maracujá; cítrico e herbal",
      },
      {
        title: "Negroni",
        shortTitle: "Negroni",
        description: "Gin, vermute rosso e Campari; amargo e intenso",
      },
      {
        title: "Macunaíma",
        shortTitle: "Macunaíma",
        description: "Cachaça, limão Taiti e Fener; cítrico e levemente amargo",
      },
      {
        title: "Especiado (Não Alcoólico)",
        shortTitle: "Especiado",
        description: "Maracujá, especiarias e limão; cítrico, frutado e picante",
      },
      {
        title: "Verdejo (Não Alcoólico)",
        shortTitle: "Verdejo",
        description: "Chá de laranja, manjericão e limão; herbal e levemente doce",
      },
    ],
  },
} as Menus;
