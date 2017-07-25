import { h, Component } from 'preact';

export default class TwilioLogo extends Component {
  render() {
    return (
      <svg
        viewBox="0 0 30 30"
        xmlns="http://www.w3.org/2000/svg"
        width="50"
        height="50"
      >
        <path
          d="M15 0C6.7 0 0 6.7 0 15s6.7 15 15 15 15-6.7 15-15S23.3 0 15 0zm0 26C8.9 26 4 21.1 4 15S8.9 4 15 4s11 4.9 11 11-4.9 11-11 11z"
          style="fill: rgb(241, 46, 69);"
        />
        <circle cx="18.7" cy="11.3" r="3.1" style="fill: rgb(241, 46, 69);" />
        <circle cx="18.7" cy="18.7" r="3.1" style="fill: rgb(241, 46, 69);" />
        <circle cx="11.3" cy="18.7" r="3.1" style="fill: rgb(241, 46, 69);" />
        <circle cx="11.3" cy="11.3" r="3.1" style="fill: rgb(241, 46, 69);" />
      </svg>
    );
  }
}
