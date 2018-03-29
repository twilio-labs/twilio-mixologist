import { h, Component } from 'preact';
import { route } from 'preact-router';

import OrderList from '../../components/order-list';
import OrderService from '../../lib/orders';
import style from './style';

export default class Orders extends Component {
  constructor() {
    super();
    this.state.orders = [];
    this.orderService = OrderService.shared();
    this.orderService.on('updated', ({ orders }) => {
      this.setState({
        orders,
      });
    });
    this.orderService.on('reset', () => {
      route('/');
    });
  }

  componentDidMount() {
    const { eventId } = this.props;
    this.orderService.init(eventId).then(orders => {
      this.setState({ orders });
    });
  }

  render() {
    return (
      <div class={style.orders}>
        <h4>
          <span data-badge={this.state.orders.length} class="mdl-badge">
            Orders
          </span>
        </h4>
        <OrderList orders={this.state.orders} />
      </div>
    );
  }
}

// {
//   number: 1,
//   product: 'Espresso',
//   message: '1 espresso',
//   source: 'sms',
//   status: 'open',
//   customer: 'xxxxxxxxxxx'
// },
// {
//   number: 42,
//   product: 'Cappuccino',
//   message: 'cappacino',
//   source: 'sms',
//   status: 'ready',
//   customer: 'xxxxxxxxxxx'
// },
// {
//   number: 200,
//   product: 'Latte',
//   message: 'latte',
//   source: 'sms',
//   status: 'cancelled',
//   customer: 'xxxxxxxxxxx'
// },
// {
//   number: 1234,
//   product: 'Espresso',
//   message: 'Some longer message with espresso in it',
//   source: 'sms',
//   status: 'open',
//   customer: 'xxxxxxxxxxx'
// },
// {
//   number: 44,
//   product: 'Espresso',
//   message: '1 espresso',
//   source: 'sms',
//   status: 'open',
//   customer: 'xxxxxxxxxxx'
// }
