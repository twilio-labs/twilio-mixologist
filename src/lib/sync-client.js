import * as EventEmitter from 'event-emitter';
import { AccessManager } from 'twilio-common';
import { SyncClient } from 'twilio-sync';

let instance;
export default class TwilioClient /* extends EventEmitter */ {
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
      this.accessManager = this.createAccessManager(token);
      this.client = this.createClient(token);
      return this.client;
    });
  }

  createClient(token) {
    const client = new SyncClient(token);
    client.on('connectionStateChanged', ({ connectionState }) => {
      if (
        connectionState === 'disconnected' ||
        connectionState === 'error' ||
        connectionState === 'denied'
      ) {
        this.emit('disconnected');
        this.client = undefined;
      }
    });
    return client;
  }

  createAccessManager(token) {
    const accessManager = new AccessManager(token);
    accessManager.on('tokenExpired', () => {
      this.fetchToken().then(({ token }) => {
        accessManager.updateToken(token);
      });
    });
    accessManager.on('tokenUpdated', () => {
      this.client.updateToken(this.accessManager.token);
    });
    return accessManager;
  }

  fetchToken() {
    return fetch('/api/token', { credentials: 'include' }).then(resp =>
      resp.json()
    );
  }
}

EventEmitter(TwilioClient.prototype);
