import { h, Component } from 'preact';
import Configurator from '../../components/configurator';
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
      <Configurator
        config={this.state.config}
        update={(key, value) => this.updateConfig(key, value)}
      />
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
