import 'material-design-lite/dist/material.indigo-red.min.css';
import '@material/select/dist/mdc.select.css';
import './style';
import App from './components/app';
import * as S entry from '@sentry/browser';

Sentry.init({
    dsn: window.SENTRY_DSN,
});

export default App;
