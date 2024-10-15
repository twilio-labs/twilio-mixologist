import { XIcon } from "lucide-react";
import {
  AmericanoIcon,
  SmoothieOrangeIcon,
  SmoothiePineappleIcon,
  SmoothieStrawberryIcon,
  SmoothieBlenderIcon,
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
} from "@/components/icons";

export default function MenuItem({
  title,
  shortTitle,
  description,
}: {
  title: string;
  shortTitle: string;
  description: string;
}) {
  const iconMap: { [key: string]: JSX.Element } = {
    "Double Espresso": (
      <EspressoDopioIcon
        width="3rem"
        height="3rem"
        fill="text-black"
        className="m-2 mr-6"
      />
    ),
    Espresso: (
      <EspressoIcon
        width="3rem"
        height="3rem"
        fill="text-black"
        className="m-2 mr-6"
      />
    ),
    Americano: (
      <AmericanoIcon
        width="3rem"
        height="3rem"
        fill="text-black"
        className="m-2 mr-6"
      />
    ),
    "Latte Macchiato": (
      <LatteMacchiatoIcon
        width="3rem"
        height="3rem"
        fill="text-black"
        className="m-2 mr-6"
      />
    ),
    "Caffè Latte": (
      <LatteMacchiatoIcon
        width="3rem"
        height="3rem"
        fill="text-black"
        className="m-2 mr-6"
      />
    ),
    "Flat White": (
      <FlatWhiteIcon
        width="3rem"
        height="3rem"
        fill="text-black"
        className="m-2 mr-6"
      />
    ),

    Macchiato: (
      <EspressoMacchiatoIcon
        width="3rem"
        height="3rem"
        fill="text-black"
        className="m-2 mr-6"
      />
    ),
    "Double Macchiato": (
      <EspressoMacchiatoIcon2
        width="3rem"
        height="3rem"
        fill="text-black"
        className="m-2 mr-6"
      />
    ),
    Cappuccino: (
      <CappuccinoIcon
        width="3rem"
        height="3rem"
        fill="text-black"
        className="m-2 mr-6"
      />
    ),
    "Espresso Macchiato": (
      <EspressoMacchiatoIcon2
        width="3rem"
        height="3rem"
        fill="text-black"
        className="m-2 mr-6"
      />
    ),
    Coffee: (
      <CoffeeIcon
        width="3rem"
        height="3rem"
        fill="text-black"
        className="m-2 mr-6"
      />
    ),
    Matcha: (
      <CoffeeCupIcon
        width="3rem"
        height="3rem"
        fill="text-black"
        className="m-2 mr-6"
      />
    ),
    Chocolate: (
      <CoffeeCupIcon
        width="3rem"
        height="3rem"
        fill="text-black"
        className="m-2 mr-6"
      />
    ),
    Mocha: (
      <CupIcon
        width="3rem"
        height="3rem"
        fill="text-black"
        className="m-2 mr-6"
      />
    ),
    "Black Tea": (
      <CupIcon
        width="3rem"
        height="3rem"
        fill="text-black"
        className="m-2 mr-6"
      />
    ),
    "British Breakfast Tea": (
      <CupIcon
        width="3rem"
        height="3rem"
        fill="text-black"
        className="m-2 mr-6"
      />
    ),
    "Apple Chamomile": (
      <CupIcon
        width="3rem"
        height="3rem"
        fill="text-black"
        className="m-2 mr-6"
      />
    ),
    "Earl Grey": (
      <CupIcon
        width="3rem"
        height="3rem"
        fill="text-black"
        className="m-2 mr-6"
      />
    ),
    "Herbal Tea": (
      <CupIcon
        width="3rem"
        height="3rem"
        fill="text-black"
        className="m-2 mr-6"
      />
    ),
    Chai: (
      <CupIcon
        width="3rem"
        height="3rem"
        fill="text-black"
        className="m-2 mr-6"
      />
    ),
    Colombia: (
      <SmoothieStrawberryIcon
        width="3rem"
        height="3rem"
        fill="text-black"
        className="m-2 mr-6"
      />
    ),
    Aquamarine: (
      <SmoothiePineappleIcon
        width="3rem"
        height="3rem"
        fill="text-black"
        className="m-2 mr-6"
      />
    ),
    Lambada: (
      <SmoothieOrangeIcon
        width="3rem"
        height="3rem"
        fill="text-black"
        className="m-2 mr-6"
      />
    ),
  };

  return (
    <div className="flex items-start py-4">
      {iconMap[shortTitle] || (
        <XIcon
          width="3rem"
          height="3rem"
          fill="text-black"
          className="m-2 mr-6"
        />
      )}
      <div>
        <h3 className="font-semibold">{title}</h3>
        <h3 className="text-sm font-semibold">{`Short title: ${shortTitle}`}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
    </div>
  );
}
