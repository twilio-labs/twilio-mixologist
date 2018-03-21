import DOMPurify from 'dompurify';
import { h, Component } from 'preact';

import style from './style';
import eventConsts from '../../../shared/event-type-consts';

export default class Icon extends Component {
  constructor(...args) {
    super(...args);
    this.state.svgData = undefined;
  }
  getSvgData(name, type) {
    const url = `${eventConsts(type).iconBasePath}${name}.svg`;
    return fetch(url).then(resp => {
      if (!resp.ok) {
        throw new Error(resp.statusText);
      }
      return resp.text();
    });
  }

  componentWillMount() {
    const eventType = this.props.type;
    this.getSvgData(this.props.name, eventType).then(svgData => {
      this.setState({ svgData });
    });
  }

  render() {
    const { color, name } = this.props;
    return (
      <span
        class={style.baristaIcon}
        style={`--color: ${color};`}
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(this.state.svgData),
        }}
      />
    );
  }
}
