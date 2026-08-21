export type { MenuItem, Menus, Order } from "@/types";
export { modes } from "@/types";
import type { Menus } from "@/types";

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
        shortTitle: "Mochaccino",
        title: "Mochaccino",
        description: "Espresso with chocolate and steamed milk",
      },
      {
        shortTitle: "Various teas",
        title: "Various teas",
        description: "Selection of finest herbal and black teas",
      },
      {
        shortTitle: "Ristretto",
        title: "Ristretto",
        description: "Concentrated shot of espresso",
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
        shortTitle: "Cold Brew",
        title: "Cold Brew",
        description: "Slow-steeped coffee served chilled over ice.",
      },
      {
        shortTitle: "Matcha",
        title: "Matcha",
        description:
          "Powder made from ground-up green tea leaves brewed into tea.",
      },
      {
        shortTitle: "Iced Matcha",
        title: "Iced Matcha",
        description: "Matcha whisked with milk and poured over ice.",
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
        description: "Rich chocolate and foamed milk",
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
      { shortTitle: "Cafè Latte",
        title: "Caffè Latte",
        description:
          "Espresso with steamed milk and light foam"
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
        description: "Green tea whisked into steamed milk",
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
      {
        shortTitle: "Moka",
        title: "Moka",
        description: "Stovetop-brewed coffee, rich and strong",
      },
      {
        shortTitle: "Espresso Chantilly",
        title: "Espresso with Chantilly",
        description: "Espresso topped with a dollop of vanilla Chantilly cream",
      },
    ],
    modifiers: [
      "Decaf",
      "Milk",
      "Whole Milk",
      "Soy Milk",
      "Almond Milk",
      "Oat Milk",
      "Skim Milk",
      "Semi-skimmed Milk",
      "Half & Half",
      "Coconut Milk",
      "Rice Milk",
      "Sugar Free Vanilla Syrup",
      "Chocolate Caramel Syrup",
      "Vanilla Syrup",
      "Chocolate Syrup",
      "Salted Caramel Syrup",
      "Peppermint Syrup",
      "Caramel Syrup",
      "Hazelnut Syrup",
      "Cinnamon Syrup",
      "Coconut Syrup",
      "Mint Syrup",
      "Dulce de leche Syrup",
      "Café de Olla Syrup",
      "Chocolate Sauce",
      "Chocolate Shavings",
      "Whipped Cream",
      "Brown Sugar Stick",
      "White Sugar Stick",
    ],
  },
  smoothie: {
    items: [
      {
        title: "Macarena",
        shortTitle: "Macarena",
        description: "Strawberry, Pineapple, Apple, Passion Fruit, Goji, Vanilla 🍓🍍",
      },
      {
        title: "La Isla Bonita",
        shortTitle: "La Isla Bonita",
        description: "Pineapple, Banana, Coconut Milk, Dates, Blue Spirulina 🍍🍌🥥",
      },
      {
        title: "Calma",
        shortTitle: "Calma",
        description: "Mango, Pineapple, Spinach, Banana, Almonds, Ginger, Lemon 🥭🌿",
      },
      {
        title: "Des.pa.cito",
        shortTitle: "Des.pa.cito",
        description: "Green 🍏🍌🌿 with citrus zing 🍋",
      },
      {
        title: "Berry Burst",
        shortTitle: "Berry Burst",
        description: "Blackcurrant, blueberry, blackberry, banana & cranberry 🫐🍌",
      },
      {
        title: "Passion Storm",
        shortTitle: "Passion Storm",
        description: "Passionfruit, peach, pineapple, papaya & aloe vera 🍑🍍",
      },
      {
        title: "Mango Dream",
        shortTitle: "Mango Dream",
        description: "Mango, pear & pineapple 🥭🍍",
      },
      {
        title: "Strawberry Delight",
        shortTitle: "Strawberry Delight",
        description: "Strawberry, peach & papaya 🍓🍑",
      },
      {
        title: "Green Reviver",
        shortTitle: "Green Reviver",
        description: "Kale, lemongrass, banana & mango 🌿🍌🥭",
      },
      {
        title: "Ginger Beets",
        shortTitle: "Ginger Beets",
        description: "Ginger, beetroot, pineapple & blueberries 🫚🍍🫐",
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
        title: "Lychee Peachy Green Tea",
        shortTitle: "Lychee Peachy Green Tea",
        description: "Lychee, Peach, Jasmine Green Tea, Lychee Jelly 🍑🍵",
      },
      {
        title: "Caramel Milk Tea",
        shortTitle: "Caramel Milk Tea",
        description: "Caramel, Oatmilk, Assam Black Tea 🍯🥛",
      },
      {
        title: "Matcha Latte",
        shortTitle: "Matcha Latte",
        description: "Matcha green tea blended with milk 🍵🥛",
      },
      {
        title: "Strawberry Matcha Latte",
        shortTitle: "Strawberry Matcha Latte",
        description: "Matcha, strawberry, and milk layered over ice 🍓🍵",
      },
      {
        title: "Strawberry Lemonade Tea",
        shortTitle: "Strawberry Lemonade Tea",
        description: "Strawberry and lemonade tea served chilled 🍓🍋",
      },
    ],
    modifiers: ["Lactose Free Whole Milk", "Oat Milk"],
  },
  waffles: {
    items: [
      {
        title: "Nuttello",
        shortTitle: "Nuttello",
        description: "Nutella drizzled over strawberries and ice cream",
      },
      {
        title: "Banoffo",
        shortTitle: "Banoffo",
        description: "Dulce de Leche over banana, Biscoff crumble and ice cream",
      },
      {
        title: "Oreo",
        shortTitle: "Oreo",
        description: "Dark chocolate drizzled over Oreo cookie crumble",
      },
      {
        title: "Snikero",
        shortTitle: "Snikero",
        description: "Dulce de Leche, chocolate, Snickers and crushed peanuts",
      },
      {
        title: "Vegan Delight",
        shortTitle: "Vegan Delight",
        description: "Strawberries, banana, Oreo crumble and maple syrup",
      },
    ],
    modifiers: ["Cream", "Ice Cream"],
  },
  cocktail: {
    items: [
      {
        title: "The SMSpresso - Espresso Martini",
        shortTitle: "Espresso Martini",
        description: "Vodka, Espresso, Coffee Liqueur, Sugar Syrup",
      },
      {
        title: "Hot White Russian",
        shortTitle: "Hot White Russian",
        description: "Vodka, Coffee Liqueur, Cream",
      },
      {
        title: "White Russian",
        shortTitle: "White Russian",
        description: "Coffee Liqueur, Vodka, Cream",
      },
      {
        title: "Irish Coffee",
        shortTitle: "Irish Coffee",
        description: "Espresso, Irish Whiskey, Raw Sugar, Fresh Cream",
      },
      {
        shortTitle: "Coffee",
        title: "Regular Coffee",
        description: "Brewed coffee, black",
      },
      {
        title: "The API Pour - Mudslide",
        shortTitle: "Mudslide",
        description: "Vodka, Coffee Liqueur, Irish Cream, Cream",
      },
      {
        shortTitle: "Espresso Martini",
        description: "Espresso, Vodka, Coffee Liqueur",
        title: "Espresso Martini",
      },
      {
        title: "Maracuia Fitzgerald",
        shortTitle: "Maracuia Fitzgerald",
        description: "Gin, limão siciliano e maracujá; cítrico e herbal",
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
        description:
          "Maracujá, especiarias e limão; cítrico, frutado e picante",
      },
      {
        title: "Verdejo (Não Alcoólico)",
        shortTitle: "Verdejo",
        description:
          "Chá de laranja, manjericão e limão; herbal e levemente doce",
      },
      {
        title: "Cosmopolitan",
        shortTitle: "Cosmo",
        description: "Vodka, Triple Sec, Cranberry Juice, Lime Juice",
      },
      {
        title: "Appletini",
        shortTitle: "Appletini",
        description: "Vodka, Apple Schnapps, Apple Juice",
      },
      {
        title: "Irish Lovers",
        shortTitle: "Irish Lovers",
        description:
          "Espresso, brown sugar, Jameson, topped with macadamia-infused cream",
      },
      {
        title: "Shakerato Lovers",
        shortTitle: "Shakerato Lovers",
        description:
          "Espresso shaken with ice, Leblon Cachaça, lemon syrup, sugarcane molasses",
      },
      {
        title: "Blue Gin Lovers",
        shortTitle: "Blue Gin Lovers",
        description:
          "Espresso, blue curaçao, tonic water and gin, garnished with lemon",
      },
    ],
    modifiers: ["Whipped Cream"],
  },
} as Menus;
