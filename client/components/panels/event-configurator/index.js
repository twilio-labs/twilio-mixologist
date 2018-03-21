import { h, Component } from 'preact';
import mdl from 'material-design-lite/material';
import { Tabs, Button, TextField, Progress } from 'preact-mdl';
import Configurator from '../configurator';
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
    <form onSubmit={onSubmit} class={style.eventForm}>
      <h5>Create a new event</h5>
      <p>
        Pick a name for the event. This name might be shown to the attendees.
      </p>
      <TextField
        floating-label={true}
        label="Event Name"
        type="text"
        name="eventName"
        value=""
        class={style.eventFormNameInput}
      />
      <Button primary raised type="submit">
        Create
      </Button>
      <hr />
    </form>
  );
};

export default class EventConfigurator extends Component {
  render() {
    const {
      events,
      currentEventId,
      currentEventConfig,
      onEventChange,
      onResetEvent,
      onDeleteEvent,
      onCreateEvent,
      onUpdateEventConfig,
      onCancelOrders,
    } = this.props;
    const eventOptions = events.map(x => (
      <option selected={x === currentEventId}>{x}</option>
    ));
    const selectEventOptions = (
      <div class={style.eventSelector}>
        <label for="eventPicker">Pick your event</label>
        <select
          id="eventPicker"
          class="mdc-select"
          value={currentEventId}
          onChange={evt => onEventChange(evt.target.value)}
        >
          {eventOptions}
        </select>
      </div>
    );
    const eventActionButtons = (
      <div>
        <h5>Other Actions</h5>
        <Button raised accent onClick={onResetEvent}>
          Reset Stats
        </Button>
        <Button accent onClick={onDeleteEvent}>
          Delete Event
        </Button>
        <Button accent onClick={onCancelOrders}>
          Cancel All Orders
        </Button>
      </div>
    );
    return (
      <div>
        <CreateEventForm onNewEvent={onCreateEvent} />
        {events.length > 0 && selectEventOptions}
        <h5>Event Configuration</h5>
        {currentEventConfig ? (
          <Configurator
            config={currentEventConfig}
            update={onUpdateEventConfig}
          />
        ) : (
          <Progress indeterminate />
        )}
        {currentEventConfig && eventActionButtons}
      </div>
    );
  }
}
