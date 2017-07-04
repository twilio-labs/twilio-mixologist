import { h, Component } from 'preact';
import style from './style';
import classnames from 'classnames/bind';

const cx = classnames.bind(style);

export default class OrderItem extends Component {
  render() {
    const itemClass = cx({
      orderItem: true,
      done: this.props.done
    });
    const { number, product, message, changeStatus } = this.props.order;
    return (
      <div class={itemClass}>
        <p class={style.number}>
          #{number}
        </p>
        <p class={style.product}>
          {product}
        </p>
        <p class={style.message}>
          <code>
            {message}
          </code>
        </p>
        <div>
          <button class={style.finish} onClick={() => changeStatus('ready')}>
            Finish
          </button>
          <button
            class={style.cancel}
            onClick={() => changeStatus('cancelled')}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }
}
