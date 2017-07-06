import { h, Component } from 'preact';
import mdl from 'material-design-lite/material';
import { TextField, Radio, Button, Card, Chip } from 'preact-mdl';

import style from './style';

export default class Other extends Component {
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

  render() {
    return (
      <div class={style.others}>
        <h4>Other Operations</h4>
        <Card shadow="2">
          <Card.Title>
            <Card.TitleText>Cancel All Open Orders</Card.TitleText>
          </Card.Title>
          <Card.Text>
            Empties all open orders and sends cancellation messages to everyone.
          </Card.Text>
          <Card.Actions class="mdl-card--border">
            <Button raised accent onClick={() => this.cancelAllOpens()}>
              Cancel All Open Orders
            </Button>
          </Card.Actions>
        </Card>
        <Card shadow="2">
          <Card.Title>
            <Card.TitleText>Reset Complete Application</Card.TitleText>
          </Card.Title>
          <Card.Text>
            This will clear out all open and past orders, reset the
            configuration to default, delete all Notify bindings and clear the
            customer map.
          </Card.Text>
          <Card.Actions class="mdl-card--border">
            <Button
              raised
              accent
              onClick={() => this.resetApplication()}
              disabled
            >
              Reset Entire Application
            </Button>
          </Card.Actions>
        </Card>
      </div>
    );
  }
}
