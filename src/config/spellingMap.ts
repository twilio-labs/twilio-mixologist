// This file is used to map the spelling of drinks to the canonical spelling
// the structure is: { misspelling: "canonical spelling" }

export interface SpellingMap {
  [key: string]: string;
}

export default {
  expreso: "Espresso",
  expresso: "Espresso",
  espresso: "Espresso",
  cappacino: "Cappuccino",
  capacino: "Cappuccino",
  cappocino: "Cappuccino",
  capocino: "Cappuccino",
  cappucino: "Cappuccino",
  cappuccino: "Cappuccino",
  capuccino: "Cappuccino",
  capochino: "Cappuccino",
  late: "Latt Macchiato",
  lattey: "Latte Macchiato",
  larte: "Latte Macchiato",
  lattee: "Latte Macchiato",
  latte: "Latte Macchiato",
  "cafe late": "Latte",
  "caffeé latte": "Latte",
  "caffe latte": "Latte",
  "white americano": "Americano",
  americano: "Americano",
  caffeé: "Americano",
  "flat white": "Flat White",
  flatwhite: "Flat White",
  "flat-white": "Flat White",
  "flatt white": "Flat White",
  "filter coffee": "Coffee",
  "fliter coffee": "Coffee",
  "hot chocolate": "Hot Chocolate",
  chocolate: "Hot Chocolate",
  cocolate: "Hot Chocolate",
  "soya": "soy",
} as SpellingMap;
