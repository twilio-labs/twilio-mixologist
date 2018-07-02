import { Component } from 'preact';
import { Router } from 'preact-router';
import { Match } from 'preact-router/match';
import TwilioClient from '../lib/sync-client';
import Admin from '../routes/admin';
import Dashboard from '../routes/dashboard';
import Home from '../routes/home';
import Kiosk from '../routes/kiosk';
import Orders from '../routes/orders';
import Header from './header';

export default class App extends Component {
  constructor(...args) {
    super(...args);
    this.state.isLoggedIn = false;
    this.state.isAdmin = false;
    this.syncClient = TwilioClient.shared();
  }

  componentWillMount() {
    this.syncClient.on('disconnected', () => {
      this.setState({ isAdmin: false, isLoggedIn: false });
    });
    const isDashboard = location.pathname.endsWith('/dashboard');
    this.syncClient
      .init(isDashboard)
      .then(() => {
        const isAdmin = this.syncClient.role === 'admin';
        const isLoggedIn = true;
        this.setState({ isAdmin, isLoggedIn });
      })
      .catch(err => {
        const isAdmin = false;
        const isLoggedIn = false;
        this.setState({ isAdmin, isLoggedIn });
      });
  }

  /** Gets fired when the route changes.
   *	@param {Object} event		"change" event from [preact-router](http://git.io/preact-router)
   *	@param {string} event.url	The newly routed URL
   */
  handleRoute = e => {
    this.currentUrl = e.url;
  };

  render() {
    return (
      <div id="app">
        <Match path="/:eventId/kiosk">
          {({ matches, path }) =>
            this.isPathWithHeader(path) && (
              <Header
                isLoggedIn={this.state.isLoggedIn}
                isAdmin={this.state.isAdmin}
              />
            )
          }
        </Match>
        <Router onChange={this.handleRoute}>
          <Home path="/" />
          <Orders path="/:eventId/orders" />
          <Admin isAdmin={this.state.isAdmin} path="/admin" />
          <Kiosk path="/:eventId/kiosk" />
          <Dashboard path="/:eventId/dashboard" />
        </Router>
      </div>
    );
  }

  isPathWithHeader(path) {
    return !path.endsWith('/kiosk') && !path.endsWith('/dashboard');
  }
}
