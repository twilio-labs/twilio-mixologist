import { h, Component } from 'preact';
import mdl from 'material-design-lite/material';
import { Tabs, Button, TextField } from 'preact-mdl';
import Configurator from '../../components/panels/configurator';
import Messenger from '../../components/panels/messenger';
import Other from '../../components/panels/other';
import ConfigService from '../../lib/config';
import style from './style';

const CreateEventForm = ({ onNewEvent }) => {
  function onSubmit(evt) {
    evt.preventDefault();
    const eventNameInput = evt.target.eventName;
    const eventName = eventNameInput.value;
    eventNameInput.value = '';
    onNewEvent(eventName);
  }

  return (
    <form onSubmit={onSubmit}>
      <TextField
        floating-label={true}
        label="New Event Name"
        type="text"
        name="eventName"
        value=""
      />
      <Button primary raised type="submit">
        Create
      </Button>
    </form>
  );
};

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
      this.setState({
        events,
        config,
        eventConfig,
      });
    } catch (err) {
      console.log('Failed to initialize Admin');
      console.error(err);
    }
  }

  render() {
    let noAdminMessage = <p>You are not admin</p>;
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
        {this.renderEventsTab()}
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

  renderEventsTab() {
    const eventOptions = this.state.events.map(x => (
      <option selected={x === this.eventId}>{x}</option>
    ));
    const selectEventOptions = (
      <select
        class="mdc-select"
        value={this.eventId}
        onChange={this.changeEvent.bind(this)}
      >
        {eventOptions}
      </select>
    );
    const eventActionButtons = (
      <div>
        <Button raised accent onClick={this.resetEventStats.bind(this)}>
          Reset Stats
        </Button>
        <Button accent onClick={this.deleteEvent.bind(this)}>
          Delete Event
        </Button>
      </div>
    );
    return (
      <Tabs.TabPanel id="events">
        <CreateEventForm onNewEvent={this.createEvent.bind(this)} />
        {this.state.events.length > 0 && selectEventOptions}
        <Configurator
          config={this.state.eventConfig}
          update={(key, value) => this.updateEventConfig(key, value)}
        />
        {this.eventId && eventActionButtons}
      </Tabs.TabPanel>
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
    try {
      const resp = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!resp.ok) {
        console.error('Failed to delete event');
        return;
      }
    } catch (err) {
      console.error('Failed to make delete request');
      return;
    }

    const events = this.state.events.filter(event => event !== eventId);
    this.eventId = events[0];
    this.setState({ events });
    if (this.eventId) {
      this.configService.changeEvent(this.eventId);
    }
  }

  async resetEventStats() {
    const eventId = this.eventId;
    try {
      const resp = await fetch('/api/admin/reset?action=stats', {
        method: 'POST',
        credentials: 'include',
      });
      if (resp.ok) {
        console.log('Reset stats');
      } else {
        throw new Error(resp.statusText);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async createEvent(eventName) {
    try {
      const resp = await fetch('/api/admin/events', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ eventName }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!resp.ok) {
        console.error('Failed to create event');
        return;
      }
      this.eventId = (await resp.json()).eventId;
    } catch (err) {
      console.log('Failed to make create request');
      console.error(err);
      return;
    }

    const events = [...this.state.events, this.eventId];
    this.setState({ events });
    this.configService.changeEvent(this.eventId);
  }
}
