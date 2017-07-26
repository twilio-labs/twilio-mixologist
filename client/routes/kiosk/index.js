import { h, Component } from 'preact';

import TwilioLogo from '../../components/twilio-logo';
import style from './style';

export default class Kiosk extends Component {
  constructor(...args) {
    super(...args);
    this.state.kioskLoaded = false;
    this.state.kioskInfo = {};
    this.state.error = undefined;
  }

  componentWillMount() {
    fetch('/api/kiosk')
      .then(resp => {
        if (!resp.ok) {
          throw new Error('Could not fetch kiosk info');
        }
        return resp.json();
      })
      .then(kioskInfo => {
        this.setState({ kioskInfo, kioskLoaded: true });
      })
      .catch(err => {
        console.error(err);
        this.setState({ kioskLoaded: false, error: err.message });
      });
  }

  render() {
    const loading = <p>Loading...</p>;
    const kiosk = !this.state.kioskLoaded
      ? loading
      : <div id="kiosk" class={style.kiosk}>
          <h1 class={style.thirsty}>Thirsty? Coffee?</h1>
          <p class={style.hr}>Skip the Queue!</p>
          <div class={style.centerContent}>
            <p>
              Make your coffee order ⚡️ <i>asynchronous</i> ⚡️
            </p>
            <p>Send your order via SMS to:</p>
            <div class={style.phoneNumbers}>
              {this.state.kioskInfo.phoneNumbers.slice(0, 4).map(num =>
                <p>
                  {num.emoji} {num.phoneNumber}
                </p>
              )}
            </div>
          </div>
          <p class={style.hr}>Enjoy</p>
          <p>
            <TwilioLogo />
          </p>
        </div>;
    return kiosk;
  }
}
