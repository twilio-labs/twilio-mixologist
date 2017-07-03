import { h, Component } from 'preact';
import OrderList from '../../components/order-list';
import style from './style';

export default class Orders extends Component {
  constructor() {
    super();
    this.state.orders = [
      {
        number: 1,
        product: 'Espresso',
        message: '1 espresso',
        source: 'sms',
        status: 'open',
        customer: 'xxxxxxxxxxx'
      },
      {
        number: 42,
        product: 'Cappuccino',
        message: 'cappacino',
        source: 'sms',
        status: 'ready',
        customer: 'xxxxxxxxxxx'
      },
      {
        number: 200,
        product: 'Latte',
        message: 'latte',
        source: 'sms',
        status: 'cancelled',
        customer: 'xxxxxxxxxxx'
      },
      {
        number: 1234,
        product: 'Espresso',
        message: 'Some longer message with espresso in it',
        source: 'sms',
        status: 'open',
        customer: 'xxxxxxxxxxx'
      },
      {
        number: 44,
        product: 'Espresso',
        message: '1 espresso',
        source: 'sms',
        status: 'open',
        customer: 'xxxxxxxxxxx'
      }
    ];
  }
  render() {
    return (
      <div class={style.orders}>
        <OrderList orders={this.state.orders} />
      </div>
    );
  }
}
