import { h, Component } from 'preact';
import { Link } from 'preact-router';
import mdl from 'material-design-lite/material';
import { Card, Button, Progress } from 'preact-mdl';
import style from './style';

export default class Home extends Component {
  constructor(...args) {
    super(...args);
    this.state = {
      events: undefined,
    };
  }

  async componentWillMount() {
    const { events } = await (await fetch(
      '/api/admin/events?type=full'
    )).json();
    this.setState({ events });
  }

  render() {
    let events = this.state.events ? (
      this.state.events.map(({ eventId, eventName }) => (
        <EventEntry eventId={eventId} name={eventName} />
      ))
    ) : (
      <Progress indeterminate />
    );
    return (
      <div class={style.home}>
        <h2>Twilio Barista</h2>
        <p>Welcome to Twilio Barista. Please pick your event:</p>
        <div class={style.container}>{events}</div>
      </div>
    );
  }
}

const EventEntry = ({ eventId, name }) => {
  return (
    <Card shadow={2} class={style.eventEntry}>
      <Card.Title>
        <Card.TitleText>{name}</Card.TitleText>
      </Card.Title>
      <Card.Text>Event ID: {eventId}</Card.Text>
      <Card.Actions>
        <Link href={`/${eventId}/orders`}>
          <Button primary class={style.actionButton}>
            📝 Orders
          </Button>
        </Link>
        <Link href={`/${eventId}/kiosk`}>
          <Button primary class={style.actionButton}>
            📱 Kiosk
          </Button>
        </Link>
        <Link href={`/${eventId}/dashboard`}>
          <Button primary class={style.actionButton}>
            📊 Dashboard
          </Button>
        </Link>
      </Card.Actions>
    </Card>
  );
};
