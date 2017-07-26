import { h, Component } from 'preact';

import BaristaIcon from '../barista-icon';
import style from './style';

const ICON_MAP = {
  Cappuccino: 'cappuccino',
  Tea: 'cup-of-coffee',
  'Hot Chocolate': 'coffee-to-go',
  'Flat White': 'flat-white',
  Latte: 'cafe-latte',
  Americano: 'americano',
  Mocca: 'coffee-to-go',
  Espresso: 'espresso-maker',
  'Filter Coffee': 'coffee-filter'
};

export default class ProductListings extends Component {
  render({ products }) {
    const productEntries = Object.keys(products).map(product => {
      const value = products[product];
      const icon = ICON_MAP[product] || 'coffee-to-go';
      return (
        <div class={style.entryWrapper}>
          <p class={style.entryName}>
            {product}
          </p>
          <div class={style.entry}>
            <BaristaIcon class={style.icon} color="#fff" name={icon} />
            <p class={style.value}>
              {value}
            </p>
          </div>
        </div>
      );
    });
    return (
      <div class={style.byProduct}>
        {productEntries}
      </div>
    );
  }
}
