import { h, Component } from 'preact';
import { Link } from 'preact-router/match';
import style from './style';

export default class Configurator extends Component {
  render() {
    const { config } = this.props;
    const entries = Object.keys(config).map(configName => {
      const value = config[configName];
      if (typeof value === 'boolean') {
        return this.createBooleanInput(configName, value);
      } else if (Array.isArray(value)) {
        return this.createArrayInput(configName, value);
      } else if (typeof value === 'object') {
        return this.createJsonInput(configName, value);
      } else {
        return this.createTextInput(configName, value);
      }
    });
    return (
      <div>
        {entries}
      </div>
    );
  }

  createTextInput(key, value) {
    return (
      <div>
        <label for={key + 'Input'}>
          {key}
        </label>
        <input
          id={key + 'Input'}
          type="text"
          name={key}
          value={value}
          onChange={evt => this.handleInputChange(evt)}
        />
      </div>
    );
  }

  createBooleanInput(key, value) {
    return (
      <div>
        <label for={key + 'Input'}>
          {key}
        </label>
        <input
          id={key + 'Input'}
          type="checkbox"
          name={key}
          checked={value}
          onChange={evt => this.handleInputChange(evt)}
        />
      </div>
    );
  }

  createArrayInput(key, value) {
    return (
      <div>
        <label for={key + 'Input'}>
          {key}
        </label>
        <input
          id={key + 'Input'}
          type="text"
          name={key}
          value={value.join(', ')}
          onChange={evt => this.handleArrayInputChange(evt)}
        />
      </div>
    );
  }

  createJsonInput(key, value) {
    return (
      <div>
        <label for={key + 'Input'}>
          {key}
        </label>
        <textarea
          id={key + 'Input'}
          name={key}
          onChange={evt => this.handleJsonInputChange(evt)}
        >
          {JSON.stringify(value, undefined, 2)}
        </textarea>
      </div>
    );
  }

  handleInputChange(evt) {
    const target = evt.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.props.update(name, value);
  }

  handleArrayInputChange(evt) {
    let { value, name } = evt.target;
    value = value.split(',').map(s => s.trim()).filter(s => s.length > 0);

    this.props.update(name, value);
  }

  handleJsonInputChange(evt) {
    let { value, name } = evt.target;
    value = JSON.parse(value);
    this.props.update(name, value);
  }
}
