import { SyncClient } from 'twilio-sync';

let instance;
export default class TwilioClient {
  static shared() {
    instance = instance || new TwilioClient();
    return instance;
  }

  constructor() {
    this.client = undefined;
  }

  init() {
    if (this.client) {
      return Promise.resolve(this.client);
    }

    return fetch('/api/token', { credentials: 'include' })
      .then(resp => resp.json())
      .then(({ token }) => {
        this.client = new SyncClient(token);
        return this.client;
      });
  }
}
