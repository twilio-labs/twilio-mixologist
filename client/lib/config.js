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

  init(eventId) {
    this.eventId = eventId;
    return TwilioClient.shared()
      .init()
      .then(twilioClient => {
        this.client = twilioClient;
        return this.client.document(SYNC_NAMES.CONFIGURATION);
      })
      .then(doc => {
        this.globalConfigurationDoc = doc;
        this.globalConfig = doc.value;
        this.addGlobalEventListeners();
        return this.globalConfig;
      })
      .then(() => {
        return this.client.document(SYNC_NAMES.EVENT_CONFIG + eventId);
      })
      .then(doc => {
        this.eventConfigurationDoc = doc;
        this.eventConfig = doc.value;
        this.addEventEventListeners();
        return { eventConfig: this.eventConfig, config: this.globalConfig };
      });
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

  changeEvent(eventId) {
    this.client.document(SYNC_NAMES.EVENT_CONFIG + eventId).then(doc => {
      this.eventConfigurationDoc = doc;
      this.eventConfig = doc.value;
      this.addEventEventListeners();
      this.emit('updatedEvent', { eventConfig: this.eventConfig });
      return { eventConfig: this.eventConfig };
    });
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
