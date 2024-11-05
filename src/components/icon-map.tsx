import {
  AmericanoIcon,
  SmoothieOrangeIcon,
  SmoothiePineappleIcon,
  SmoothieStrawberryIcon,
  EspressoDopioIcon,
  EspressoIcon,
  LatteMacchiatoIcon,
  FlatWhiteIcon,
  EspressoMacchiatoIcon,
  EspressoMacchiatoIcon2,
  CappuccinoIcon,
  CoffeeCupIcon,
  CupIcon,
  CoffeeIcon,
  FrappuccinoIcon,
} from "@/components/icons";

const iconMap: { [key: string]: any } = {
  "Double Espresso": EspressoDopioIcon,
  Espresso: EspressoIcon,
  Americano: AmericanoIcon,
  "Latte Macchiato": LatteMacchiatoIcon,
  "Caffè Latte": LatteMacchiatoIcon,
  "Flat White": FlatWhiteIcon,
  Macchiato: EspressoMacchiatoIcon,
  "Double Macchiato": EspressoMacchiatoIcon2,
  Cappuccino: CappuccinoIcon,
  "Espresso Macchiato": EspressoMacchiatoIcon2,
  Coffee: CoffeeIcon,
  Matcha: CoffeeCupIcon,
  Chocolate: CoffeeCupIcon,
  Mocha: CupIcon,
  "Iced Latte": FrappuccinoIcon,
  "Iced Americano": FrappuccinoIcon,
  "Black Tea": CupIcon,
  "British Breakfast Tea": CupIcon,
  "Apple Chamomile": CupIcon,
  "Earl Grey": CupIcon,
  "Herbal Tea": CupIcon,
  Chai: CupIcon,
  Colombia: SmoothieStrawberryIcon,
  Aquamarine: SmoothiePineappleIcon,
  Lambada: SmoothieOrangeIcon,
};

export default iconMap;
