import { h, Component } from 'preact';

import Icon from '../icon';
import style from './style';
import eventConsts from '../../../shared/event-type-consts';

export default class ProductListings extends Component {
  render({ products, eventType }) {
    const { dashboard } = eventConsts(eventType);

    const productEntries = Object.keys(products).map(product => {
      const value = products[product];
      const icon =
        dashboard.productIcons[product] || dashboard.defaultProductIcon;
      return (
        <div class={style.entryWrapper}>
          <p class={style.entryName}>{product}</p>
          <div class={style.entry}>
            <Icon
              class={style.icon}
              color="#fff"
              name={icon}
              type={eventType}
            />
            <p class={style.value}>{value}</p>
          </div>
        </div>
      );
    });
    return <div class={style.byProduct}>{productEntries}</div>;
  }
}
