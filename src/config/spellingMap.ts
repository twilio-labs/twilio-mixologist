// This file is used to map the spelling of drinks to the canonical spelling
// the structure is: { misspelling: "canonical spelling" }

export interface SpellingMap {
  [key: string]: string;
}

export default {
  americano: "Americano",
  "cafe late": "Caffè Latte",
  "cafe latte": "Caffè Latte",
  caffe: "Caffè",
  cappacino: "Cappuccino",
  capacino: "Cappuccino",
  cappocino: "Cappuccino",
  capocino: "Cappuccino",
  cappucino: "Cappuccino",
  cappuccino: "Cappuccino",
  capuccino: "Cappuccino",
  capochino: "Cappuccino",
  expreso: "Espresso",
  expresso: "Espresso",
  espresso: "Espresso",
  "flat white": "Flat White",
  flatwhite: "Flat White",
  "flat-white": "Flat White",
  "flatt white": "Flat White",
  "filter coffee": "Coffee",
  "fliter coffee": "Coffee",
  late: "Latt",
  lattey: "Latte",
  larte: "Latte",
  lattee: "Latte",
  latte: "Latte",
  "white americano": "Americano",
  "hot chocolate": "Hot Chocolate",
  chocolate: "Hot Chocolate",
  cocolate: "Hot Chocolate",
  soya: "soy",
} as SpellingMap;
