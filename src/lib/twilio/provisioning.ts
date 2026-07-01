"use server";

import { appendFileSync } from "fs";
import { ServiceInstance } from "twilio/lib/rest/sync/v1/service";
import { twilioClient } from "./client";

const {
  TWILIO_MESSAGING_SERVICE_SID = "",
  TWILIO_SYNC_SERVICE_SID = "",
  TWILIO_VERIFY_SERVICE_SID = "",
  SERVICE_INSTANCE_PREFIX = "",
} = process.env;

export async function getLookupService() {
  return twilioClient.lookups.v2;
}

export async function createServiceInstances() {
  let output = "";
  let messagingService, syncService: ServiceInstance;

  if (TWILIO_MESSAGING_SERVICE_SID) {
    console.log(
      `Skip creating Messaging Service because ${TWILIO_MESSAGING_SERVICE_SID} already exists`,
    );
    messagingService = await twilioClient.messaging.v1
      .services(TWILIO_MESSAGING_SERVICE_SID)
      .fetch();
  } else {
    messagingService = await twilioClient.messaging.v1.services.create({
      friendlyName: `${SERVICE_INSTANCE_PREFIX} Messaging Service`,
    });
    console.log(`Created Messaging Service ${messagingService.sid}`);
    output += `TWILIO_MESSAGING_SERVICE_SID=${messagingService.sid}\n`;
  }

  if (TWILIO_SYNC_SERVICE_SID) {
    console.log(
      `Skip creating Sync Service because ${TWILIO_SYNC_SERVICE_SID} already exists`,
    );
    syncService = await twilioClient.sync.v1
      .services(TWILIO_SYNC_SERVICE_SID)
      .fetch();
  } else {
    syncService = await twilioClient.sync.v1.services.create({
      friendlyName: `${SERVICE_INSTANCE_PREFIX} Sync Service`,
      aclEnabled: true,
    });
    console.log(`Created Sync Service ${syncService.sid}`);
    output += `TWILIO_SYNC_SERVICE_SID=${syncService.sid}\n`;
  }

  if (TWILIO_VERIFY_SERVICE_SID) {
    console.log(
      `Skip creating Verify Service because ${TWILIO_VERIFY_SERVICE_SID} already exists`,
    );
  } else {
    const verifyService = await twilioClient.verify.v2.services.create({
      friendlyName: `${SERVICE_INSTANCE_PREFIX} Verify Service`,
    });
    console.log(`Created Verify Service ${verifyService.sid}`);
    output += `TWILIO_VERIFY_SERVICE_SID=${verifyService.sid}\n`;
  }

  if (output.length > 0) {
    appendFileSync(".env.local", output);
    console.log(
      "The following lines have been added to your .env.locale file:",
    );
    console.log(output);
  }
}
