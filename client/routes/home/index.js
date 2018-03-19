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
      this.state.events.map(eventId => <EventEntry eventId={eventId} />)
    ) : (
      <Progress indeterminate />
    );
    return (
      <div class={style.home}>
        <h2>Twilio Barista</h2>
        <p>Welcome to Twilio Barista. Please pick your event:</p>
        {events}
      </div>
    );
  }
}

const EventEntry = ({ eventId }) => {
  return (
    <Card shadow={2} style={{ marginBottom: '20px' }}>
      <Card.Title>
        <Card.TitleText>{eventId}</Card.TitleText>
      </Card.Title>
      {/* <Card.Text>Something...</Card.Text> */}
      <Card.Actions>
        <Link href={`/${eventId}/orders`}>
          <Button primary style={{ width: '100%', textAlign: 'left' }}>
            📝 Orders
          </Button>
        </Link>
        <Link href={`/${eventId}/kiosk`}>
          <Button primary style={{ width: '100%', textAlign: 'left' }}>
            📱 Kiosk
          </Button>
        </Link>
        <Link href={`/${eventId}/dashboard`}>
          <Button primary style={{ width: '100%', textAlign: 'left' }}>
            📊 Dashboard
          </Button>
        </Link>
      </Card.Actions>
    </Card>
  );
};
