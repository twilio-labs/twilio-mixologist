import { h, Component } from 'preact';
import mdl from 'material-design-lite/material';
import { Tabs, Button } from 'preact-mdl';
import Configurator from '../../components/panels/configurator';
import Messenger from '../../components/panels/messenger';
import Other from '../../components/panels/other';
import ConfigService from '../../lib/config';
import style from './style';

export default class Orders extends Component {
  constructor(...args) {
    super(...args);

    this.state.events = [];
    this.state.config = {};
    this.state.eventConfig = {};
    this.configService = ConfigService.shared();
    this.configService.on('updatedGlobal', ({ config }) => {
      this.setState({ config });
    });
    this.configService.on('updatedEvent', ({ eventConfig }) => {
      this.setState({ eventConfig });
    });
  }

  async componentDidMount() {
    try {
      const { events } = await (await fetch('/api/admin/events')).json();
      this.eventId = events[0];
      const { config, eventConfig } = await this.configService.init(
        this.eventId
      );
      this.setState({ events, config, eventConfig });
    } catch (err) {
      console.log('Failed to initialize Admin');
      console.error(err);
    }
  }

  render() {
    let noAdminMessage = <p>You are not admin</p>;
    const eventOptions = this.state.events.map(x => <option>{x}</option>);
    let adminInterface = (
      <Tabs>
        <Tabs.TabBar class={style.tabsLeft}>
          <Tabs.Tab href="#configuration" active>
            Configuration
          </Tabs.Tab>
          <Tabs.Tab href="#events">Events</Tabs.Tab>
          <Tabs.Tab href="#messages">Messages</Tabs.Tab>
          <Tabs.Tab href="#other">Other</Tabs.Tab>
        </Tabs.TabBar>
        <Tabs.TabPanel id="configuration" active>
          <Configurator
            config={this.state.config}
            update={(key, value) => this.updateConfig(key, value)}
          />
        </Tabs.TabPanel>
        <Tabs.TabPanel id="events">
          <select value={this.eventId} onChange={this.changeEvent.bind(this)}>
            {eventOptions}
          </select>
          <Configurator
            config={this.state.eventConfig}
            update={(key, value) => this.updateEventConfig(key, value)}
          />

          <Button raised primary onClick={this.deleteEvent.bind(this)}>
            Delete Event
          </Button>
        </Tabs.TabPanel>
        <Tabs.TabPanel id="messages">
          <Messenger />
        </Tabs.TabPanel>
        <Tabs.TabPanel id="other">
          <Other />
        </Tabs.TabPanel>
      </Tabs>
    );
    return (
      <div class={style.admin}>
        <h4>Admin</h4>
        {this.props.isAdmin ? adminInterface : noAdminMessage}
      </div>
    );
  }

  updateConfig(key, value) {
    this.configService.updateValue(key, value);
  }

  updateEventConfig(key, value) {
    this.configService.updateValue(key, value, 'event');
  }

  changeEvent(evt) {
    this.eventId = event.target.value;
    this.configService.changeEvent(this.eventId);
  }

  async deleteEvent() {
    const eventId = this.eventId;
    const resp = await fetch(`/api/admin/events/${eventId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    const events = this.state.events.filter(event => event !== eventId);
    this.eventId = events[0];
    this.setState({ events });
    if (this.eventId) {
      this.configService.changeEvent(this.eventId);
    }
  }
}
