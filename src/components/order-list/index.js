import { h, Component } from 'preact';
import OrderItem from '../order-item';

export default class OrderList extends Component {
  render() {
    return (
      <div>
        {this.props.orders.map(order => {
          return <OrderItem order={order} done={order.status !== 'open'} />;
        })}
      </div>
    );
  }
}
