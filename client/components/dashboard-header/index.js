import { h } from 'preact';

import TwilioLogo from '../twilio-logo';
import Icon from '../icon';

import style from './style';
import consts from '../../../shared/event-type-consts';

const DashboardHeader = ({ url, numberOne, numberTwo, eventType }) => {
  let numbers = [numberOne, numberTwo]
    .filter(x => !!x)
    .map(num => <span class={style.number}>{num}</span>);

  if (numbers.length > 1) {
    numbers = [numbers[0], ' or ', numbers[1]];
  }

  const { dashboard } = consts(eventType);
  const icon = (
    <Icon name={dashboard.headerIcon} color="#fff" type={eventType} />
  );

  return (
    <header class={style.header}>
      {icon}
      <hgroup class={style.titleText}>
        <h1>
          <TwilioLogo width={153} height={45} color="#fff" fullLogo={true} />
          <span>{dashboard.headerTitle}</span>
        </h1>
        <h2>Text your order to {numbers}</h2>
        <h2>
          See how we built it <span class={style.repoLink}>{url}</span>
        </h2>
      </hgroup>
      {icon}
    </header>
  );
};

export default DashboardHeader;
