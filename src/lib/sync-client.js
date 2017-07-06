import { AccessManager } from 'twilio-common';
import { SyncClient } from 'twilio-sync';

let instance;
export default class TwilioClient {
  static shared() {
    instance = instance || new TwilioClient();
    return instance;
  }

  constructor() {
    this.accessManager = undefined;
    this.client = undefined;
    this.role = undefined;
  }

  init() {
    if (this.client) {
      return Promise.resolve(this.client);
    }

    return this.fetchToken().then(({ token, identity }) => {
      this.role = identity;
      this.createAccessManager(token);
      this.client = new SyncClient(token);
      return this.client;
    });
  }

  createAccessManager(token) {
    this.accessManager = new AccessManager(token);
    this.accessManager.on('tokenExpired', () => {
      this.fetchToken().then(({ token }) => {
        this.accessManager.updateToken(token);
      });
    });
    this.accessManager.on('tokenUpdated', () => {
      this.client.updateToken(this.accessManager.token);
    });
    return this.accessManager;
  }

  fetchToken() {
    return fetch('/api/token', { credentials: 'include' }).then(resp =>
      resp.json()
    );
  }
}
