import { h, Component } from 'preact';
import mdl from 'material-design-lite/material';
import { TextField, Radio, Button, Card, Chip } from 'preact-mdl';

import style from './style';

export default class Messenger extends Component {
  constructor(...args) {
    super(...args);
    this.state.sendTo = 'all';
  }

  sendMessage(evt) {
    evt.preventDefault();
    const { sendTo, message, identity } = evt.target;

    const data = {
      sendTo: sendTo.value,
      message: message.value
    };
    if (identity) {
      data.identity = identity.value;
    }
    fetch('/api/admin/notification', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify(data)
    })
      .then(resp => {
        if (resp.ok) {
          return resp.json();
        } else {
          throw new Error('Failed request');
        }
      })
      .then(data => {
        this.setState({
          sendTo: 'all',
          message: undefined,
          identity: undefined,
          messageSent: true
        });
        setTimeout(() => {
          this.setState({ messageSent: undefined });
        }, 5000);
      })
      .catch(err => {
        console.error(err);
      });
  }

  handleInputChange(evt) {
    this.setState({ [evt.target.name]: evt.target.value });
  }

  render() {
    return (
      <div>
        <h4>Send a message</h4>
        <form onSubmit={evt => this.sendMessage(evt)}>
          <Card class={style.card} shadow="2">
            <Card.Text>
              <div class={style.radioContainer}>
                <Radio
                  name="sendTo"
                  value="all"
                  checked={this.state.sendTo === 'all'}
                  onChange={evt => this.handleInputChange(evt)}
                >
                  All
                </Radio>
                <Radio
                  name="sendTo"
                  value="activeOrders"
                  checked={this.state.sendTo === 'activeOrders'}
                  onChange={evt => this.handleInputChange(evt)}
                >
                  Active Orders
                </Radio>
                <Radio
                  name="sendTo"
                  value="individual"
                  checked={this.state.sendTo === 'individual'}
                  onChange={evt => this.handleInputChange(evt)}
                >
                  Individual
                </Radio>
              </div>
              {this.state.sendTo === 'individual' &&
                <div>
                  <TextField
                    name="identity"
                    float-label
                    value={this.state.identity}
                    onChange={evt => this.handleInputChange(evt)}
                  >
                    Identity of individual...
                  </TextField>
                </div>}
              <div>
                <TextField
                  class={style.messageInput}
                  multiline
                  name="message"
                  onChange={evt => this.handleInputChange(evt)}
                  value={this.state.message}
                >
                  Type your message...
                </TextField>
              </div>
            </Card.Text>
            <Card.Actions class="mdl-card--border">
              <Button raised primary type="submit">
                Send Message
              </Button>
              {this.state.messageSent &&
                <span class="mdl-chip">
                  <span class="mdl-chip__text">
                    Your message has been sent!
                  </span>
                </span>}
            </Card.Actions>
          </Card>
        </form>
      </div>
    );
  }
}
