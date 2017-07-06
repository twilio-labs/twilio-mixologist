import * as EventEmitter from 'event-emitter';
import TwilioClient from './sync-client';
import { SYNC_NAMES } from '../../shared/consts';

let instance;

export default class ConfigService /* extends EventEmitter */ {
  static shared() {
    instance = instance || new ConfigService();
    return instance;
  }

  constructor() {
    this.config = undefined;
    this.configurationDoc = undefined;
  }

  getConfig() {
    return this.config;
  }

  init() {
    return TwilioClient.shared()
      .init()
      .then(client => {
        return client.document(SYNC_NAMES.CONFIGURATION);
      })
      .then(doc => {
        this.configurationDoc = doc;
        this.config = doc.value;
        this.addEventListeners();
        return this.config;
      });
  }

  addEventListeners() {
    this.configurationDoc.on('updated', data => {
      this.config = data;
      this.emit('updated', { config: data });
    });

    this.configurationDoc.on('updatedRemotely', data => {
      this.config = data;
      this.emit('updated', { config: data });
    });
  }

  updateValue(key, value) {
    if (!key) {
      return;
    }

    this.configurationDoc.update({
      [key]: value
    });
  }
}

EventEmitter(ConfigService.prototype);
