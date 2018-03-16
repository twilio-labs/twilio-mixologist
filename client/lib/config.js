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
    this.globalConfig = undefined;
    this.globalConfigurationDoc = undefined;
    this.eventConfigurationDoc = undefined;
    this.eventConfig = undefined;
    this.eventId = undefined;
    this.client = undefined;
  }

  getConfig() {
    return this.globalConfig;
  }

  async init(eventId) {
    this.eventId = eventId;
    this.client = await TwilioClient.shared().init();
    this.globalConfigurationDoc = await this.client.document(
      SYNC_NAMES.CONFIGURATION
    );
    this.globalConfig = this.globalConfigurationDoc.value;
    this.addGlobalEventListeners();

    if (!eventId) {
      return { config: this.globalConfig };
    }
    this.eventConfigurationDoc = await this.client.document(
      SYNC_NAMES.EVENT_CONFIG + eventId
    );
    this.eventConfig = this.eventConfigurationDoc.value;
    this.addEventEventListeners();
    return { eventConfig: this.eventConfig, config: this.globalConfig };
  }

  addGlobalEventListeners() {
    this.globalConfigurationDoc.on('updated', data => {
      this.globalConfig = data;
      this.emit('updatedGlobal', { config: data });
    });

    this.globalConfigurationDoc.on('updatedRemotely', data => {
      this.globalConfig = data;
      this.emit('updatedGlobal', { config: data });
    });
  }

  addEventEventListeners() {
    this.eventConfigurationDoc.on('updated', data => {
      this.eventConfig = data;
      this.emit('updatedEvent', { eventConfig: data });
    });

    this.eventConfigurationDoc.on('updatedRemotely', data => {
      this.eventConfig = data;
      this.emit('updatedEvent', { eventConfig: data });
    });
  }

  removeEventEventListeners() {
    this.eventConfigurationDoc.removeAllListeners('updated');
    this.eventConfigurationDoc.removeAllListeners('updatedRemotely');
  }

  async changeEvent(eventId) {
    const doc = await this.client.document(SYNC_NAMES.EVENT_CONFIG + eventId);
    this.eventConfigurationDoc = doc;
    this.eventConfig = doc.value;
    this.addEventEventListeners();
    this.emit('updatedEvent', { eventConfig: this.eventConfig });
    return { eventConfig: this.eventConfig };
  }

  updateValue(key, value, forDoc) {
    let doc =
      forDoc === 'event'
        ? this.eventConfigurationDoc
        : this.globalConfigurationDoc;
    if (!key) {
      return;
    }

    doc.update({
      [key]: value
    });
  }
}

EventEmitter(ConfigService.prototype);
