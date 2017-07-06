import { h, Component } from 'preact';
import mdl from 'material-design-lite/material';
import { Tabs } from 'preact-mdl';
import Configurator from '../../components/configurator';
import Messenger from '../../components/panels/messenger';
import ConfigService from '../../lib/config';
import style from './style';

export default class Orders extends Component {
  constructor(...args) {
    super(...args);

    this.state.config = {};
    this.configService = ConfigService.shared();
    this.configService.on('updated', ({ config }) => {
      this.setState({ config });
    });
  }

  componentDidMount() {
    this.configService
      .init()
      .then(config => {
        this.setState({ config });
      })
      .catch(err => {
        console.log('Failed to init');
        console.error(err);
      });
  }

  render() {
    let noAdminMessage = <p>You are not admin</p>;
    let adminInterface = (
      <Tabs>
        <Tabs.TabBar>
          <Tabs.Tab href="#configuration" active>
            Configuration
          </Tabs.Tab>
          <Tabs.Tab href="#messages">Messages</Tabs.Tab>
        </Tabs.TabBar>
        <Tabs.TabPanel id="configuration" active>
          <Configurator
            config={this.state.config}
            update={(key, value) => this.updateConfig(key, value)}
          />
        </Tabs.TabPanel>
        <Tabs.TabPanel id="messages">
          <Messenger />
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
}
