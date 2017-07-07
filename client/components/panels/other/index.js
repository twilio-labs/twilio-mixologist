import { h, Component } from 'preact';
import mdl from 'material-design-lite/material';
import { TextField, Radio, Button, Card, Chip, Progress } from 'preact-mdl';

import style from './style';

export default class Other extends Component {
  constructor(...args) {
    super(...args);
    this.state.availableCountries = undefined;
    this.state.selectedCountry = undefined;
  }

  cancelAllOpens() {
    fetch('/api/reset?action=openOrders', {
      method: 'POST',
      credentials: 'include'
    })
      .then(resp => {
        if (resp.ok) {
          console.log('Cleared queue');
        } else {
          throw new Error(resp.statusText);
        }
      })
      .catch(err => {
        console.error(err);
      });
  }

  resetApplication() {
    fetch('/api/reset?action=resetApplication', {
      method: 'POST',
      credentials: 'include'
    })
      .then(resp => {
        if (resp.ok) {
          console.log('Reset application');
        } else {
          throw new Error(resp.statusText);
        }
      })
      .catch(err => {
        console.error(err);
      });
  }

  getAvailableCountries() {
    fetch('/api/numbers')
      .then(resp => {
        if (resp.ok) {
          return resp.json();
        } else {
          throw new Error(resp.statusText);
        }
      })
      .then(({ countries }) => {
        this.setState({ availableCountries: countries });
      })
      .catch(err => {
        console.error(err);
      });
  }

  choseCountry(countryCode) {
    this.setState({ selectedCountry: countryCode });
  }

  acquirePhoneNumber() {
    const code = this.state.selectedCountry;
    fetch('/api/numbers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ code })
    })
      .then(resp => {
        if (resp.ok) {
          console.log('Phone number configured');
          this.setState({ selectedCountry: undefined });
        } else {
          throw new Error(resp.statusText);
        }
      })
      .catch(err => {
        console.error(err);
      });
  }

  componentDidMount() {
    this.getAvailableCountries();
  }

  render() {
    return (
      <div class={style.others}>
        <h4>Other Operations</h4>
        <div class={style.cardContainer}>
          <ActionCard
            title="Cancel All Open Orders"
            buttonText="Cancel All Open Orders"
            action={() => this.cancelAllOpens()}
          >
            Empties all open orders and sends cancellation messages to everyone.
          </ActionCard>
          <ActionCard
            title="Acquire New Phone Number"
            buttonText="Acquire Number"
            action={() => this.acquirePhoneNumber()}
            disabled={!this.state.selectedCountry}
          >
            <p>
              Choose a country that you want a phone number to acquire for. Once
              acquired it will appear in the config under{' '}
              <code>connectedPhoneNumbers</code>.
            </p>
            {this.state.availableCountries !== undefined
              ? <CountryPicker
                  countries={this.state.availableCountries}
                  value={this.state.selectedCountry}
                  onSelect={value => this.choseCountry(value)}
                />
              : <Progress indeterminate />}
          </ActionCard>
          <ActionCard
            title="Reset Complete Application"
            buttonText="Reset Entire Application"
            action={() => this.resetApplication()}
            disabled
          >
            This will clear out all open and past orders, reset the
            configuration to default, delete all Notify bindings and clear the
            customer map.
          </ActionCard>
        </div>
      </div>
    );
  }
}

function ActionCard({ title, children, buttonText, action, disabled }) {
  return (
    <Card shadow="2">
      <Card.Title>
        <Card.TitleText>
          {title}
        </Card.TitleText>
      </Card.Title>
      <Card.Text class={style.flexOne}>
        {children}
      </Card.Text>
      <Card.Actions class="mdl-card--border">
        <Button raised accent onClick={action} disabled={disabled}>
          {buttonText}
        </Button>
      </Card.Actions>
    </Card>
  );
}

function CountryPicker({ countries, onSelect, value }) {
  function onChange(evt) {
    const val = evt.target.value;
    onSelect(val);
  }
  return (
    <select class="mdc-select" onChange={onChange}>
      {countries.map(c => {
        return (
          <option value={c.code} selected={value === c.code}>
            {c.country}
          </option>
        );
      })}
    </select>
  );
}
