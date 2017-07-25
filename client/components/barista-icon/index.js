import DOMPurify from 'dompurify';
import { h, Component } from 'preact';

import style from './style';

export default class BaristaIcon extends Component {
  constructor(...args) {
    super(...args);
    this.state.svgData = undefined;
  }
  getSvgData(name) {
    const url = `/assets/barista-icons/barista-icons_${name}.svg`;
    return fetch(url).then(resp => {
      if (!resp.ok) {
        throw new Error(resp.statusText);
      }
      return resp.text();
    });
  }

  componentWillMount() {
    this.getSvgData(this.props.name).then(svgData => {
      this.setState({ svgData });
    });
  }

  render() {
    const { color, name } = this.props;
    return (
      <span
        class={style.baristaIcon}
        style={{ '--color': color }}
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(this.state.svgData)
        }}
      />
    );
  }
}
