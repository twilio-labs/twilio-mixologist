import { Component } from 'preact';
import { Button, Radio, TextField } from 'preact-mdl';
import style from './style';

export default class MetricsPanel extends Component {
  constructor(...args) {
    super(...args);
    this.state = {
      stats: undefined,
    };
  }

  async retrieveStats(evt) {
    evt.preventDefault();
    const { eventId, startDate, endDate, cache } = evt.target;
    let cacheFlag = cache.value || '';

    const resp = await fetch(
      `/api/admin/metrics/${eventId.value}?startDate=${
        startDate.value
      }&endDate=${endDate.value}&cache=${cacheFlag}`
    );
    if (!resp.ok) {
      this.setState({ stats: await resp.text() });
      return;
    }

    const stats = await resp.json();
    const textStats = Object.keys(stats)
      .sort()
      .map(key => `${key}: ${stats[key]}`)
      .join('\n');
    this.setState({ stats: textStats });
  }

  render({ events }) {
    const eventOptions = events ? events.map(x => <option>{x}</option>) : [];
    const selectEventOptions = (
      <div>
        <label for="eventPicker">Pick your event</label>
        <select id="eventPicker" class="mdc-select" name="eventId">
          {eventOptions}
        </select>
      </div>
    );
    return (
      <div>
        <h4>Retrieve Metrics</h4>
        <form class={style.form} onSubmit={evt => this.retrieveStats(evt)}>
          {selectEventOptions}
          <TextField name="startDate" floating-label>
            Start Date in YYYY-MM-DD
          </TextField>
          <TextField name="endDate" floating-label>
            End Date in YYYY-MM-DD
          </TextField>
          <Radio name="cache" value="">
            Fetch stats
          </Radio>
          <Radio name="cache" value="write">
            Fetch & save new stats
          </Radio>
          <Radio name="cache" value="read">
            Load saved stats
          </Radio>
          <Button accent raised type="submit">
            Retrieve Stats
          </Button>
        </form>
        {this.state.stats && (
          <div>
            <pre>{this.state.stats}</pre>
          </div>
        )}
      </div>
    );
  }
}
