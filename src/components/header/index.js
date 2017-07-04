import { h, Component } from 'preact';
import { Link } from 'preact-router/match';
import style from './style';

export default class Header extends Component {
  render() {
    return (
      <header class={style.header}>
        <h1>Twilio Barista</h1>
        <nav>
          <Link activeClassName={style.active} href="/">
            Home
          </Link>
          <Link activeClassName={style.active} href="/orders">
            Orders
          </Link>
          <Link activeClassName={style.active} href="/admin">
            Admin
          </Link>
        </nav>
      </header>
    );
  }
}
