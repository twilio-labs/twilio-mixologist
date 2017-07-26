import { h, Component } from 'preact';

import TwilioLogo from '../twilio-logo';
import BaristaIcon from '../barista-icon';

import style from './style';

export default class DashboardHeader extends Component {
  render({ url, numberOne, numberTwo }) {
    return (
      <header class={style.header}>
        <BaristaIcon name="coffee-shop-sign" color="#fff" />
        <hgroup class={style.titleText}>
          <h1>
            <TwilioLogo width={153} height={45} color="#fff" fullLogo={true} />
            <span>Barista Dashboard</span>
          </h1>
          <h2>
            Text your order to <span class={style.number}>{numberOne}</span> or{' '}
            <span class={style.number}>{numberTwo}</span>
          </h2>
          <h2>
            See how we built it <span class={style.repoLink}>{url}</span>
          </h2>
        </hgroup>
        <BaristaIcon name="coffee-shop-sign" color="#fff" />
      </header>
    );
  }
}
