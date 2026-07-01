// Copyright (c) 2025 Twilio Inc.

"use server";

import {
  sendMessage,
  updateOrCreateSyncMapItem,
  updateSyncMapItem,
  createVerification,
  checkVerification,
} from "@/lib/twilio";
import {
  Stages,
  sleep,
  TwoWeeksInSeconds,
  regexForEmail,
  regexFor6ConsecutiveDigits,
} from "@/lib/utils";
import { checkSegmentTraits } from "./segment";
import { getReadyToOrderMessage } from "@/scripts/fetchContentTemplates";
import {
  eventLang,
  getDataPolicy,
  getErrorDuringEmailVerificationMessage,
  getInvalidEmailMessage,
  getInvalidVerificationCodeMessage,
  getModifiersMessage,
  getPromptForEmail,
  getSentEmailMessage,
} from "@/lib/stringTemplates";
import type { Event } from "@/types";

const NEXT_PUBLIC_ATTENDEES_MAP =
  process.env.NEXT_PUBLIC_ATTENDEES_MAP || "";

function sanitizeFullName(fullName: string) {
  return fullName
    .replace(/[^a-zA-Z\s\-\.\']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function sendReadyToOrder(
  sender: string,
  event: Event,
  isReturning: boolean,
) {
  const message = await getReadyToOrderMessage(
    event,
    event.selection.items,
    event.maxOrders,
    isReturning,
    eventLang(event),
  );
  sendMessage(
    sender,
    "",
    message.contentSid,
    message.contentVariables,
  );
  if (event.selection.modifiers.length > 1) {
    await sleep(1500);
    sendMessage(
      sender,
      getModifiersMessage(event.selection.modifiers, eventLang(event)),
    );
  }
  await sleep(2000);
  sendMessage(
    sender,
    getDataPolicy(event.selection.mode, eventLang(event)),
  );
}

export async function handleProfileMode(
  phone: string,
  sender: string,
  attendeeRecord: any,
  event: Event,
  incomingMessageBody: string,
  leadCollection: string,
): Promise<boolean> {
  const stage = attendeeRecord.stage as Stages;

  // NONE mode: auto-register on first message
  if (leadCollection === "NONE" && stage === Stages.NEW_USER) {
    await updateOrCreateSyncMapItem(
      NEXT_PUBLIC_ATTENDEES_MAP,
      phone,
      { stage: Stages.VERIFIED_USER },
      TwoWeeksInSeconds,
    );
    await sendReadyToOrder(sender, event, false);
    return true;
  }

  // MANUAL mode — already verified / ordering stages: caller handles order flow
  if (
    stage === Stages.VERIFIED_USER ||
    stage === Stages.FIRST_ORDER ||
    stage === Stages.REPEAT_CUSTOMER
  ) {
    return false;
  }

  if (stage === Stages.NEW_USER) {
    sendMessage(sender, getPromptForEmail(eventLang(event)));
    await updateSyncMapItem(
      NEXT_PUBLIC_ATTENDEES_MAP,
      phone,
      {
        fullName: sanitizeFullName(incomingMessageBody),
        stage: Stages.NAME_CONFIRMED,
      },
      TwoWeeksInSeconds,
    );
    return true;
  }

  if (stage === Stages.NAME_CONFIRMED) {
    if (!incomingMessageBody || !regexForEmail.test(incomingMessageBody)) {
      sendMessage(
        sender,
        getInvalidEmailMessage(eventLang(event)),
      );
      return true;
    }
    // @ts-ignore regex is tested above
    const email = incomingMessageBody.match(regexForEmail)[0];
    let check;
    try {
      check = await createVerification(email, event.name);
    } catch (error: any) {
      console.error(error);
      sendMessage(
        sender,
        getErrorDuringEmailVerificationMessage(error.message, eventLang(event)),
      );
      return true;
    }
    sendMessage(sender, getSentEmailMessage(eventLang(event)));
    await updateSyncMapItem(
      NEXT_PUBLIC_ATTENDEES_MAP,
      phone,
      { stage: Stages.VERIFYING, email, checkSid: check.sid },
      TwoWeeksInSeconds,
    );
    return true;
  }

  if (stage === Stages.VERIFYING) {
    // User re-sent an email address — resend verification
    if (regexForEmail.test(incomingMessageBody)) {
      // @ts-ignore regex tested above
      const email = incomingMessageBody.match(regexForEmail)[0];
      let check;
      try {
        check = await createVerification(email, event.name);
      } catch (error: any) {
        console.error(error);
        sendMessage(
          sender,
          getErrorDuringEmailVerificationMessage(error.message, eventLang(event)),
        );
        return true;
      }
      sendMessage(sender, getSentEmailMessage(eventLang(event)));
      await updateSyncMapItem(
        NEXT_PUBLIC_ATTENDEES_MAP,
        phone,
        { checkSid: check.sid, email },
        TwoWeeksInSeconds,
      );
      return true;
    }

    if (!regexFor6ConsecutiveDigits.test(incomingMessageBody)) {
      sendMessage(
        sender,
        getInvalidVerificationCodeMessage(eventLang(event)),
      );
      return true;
    }

    try {
      // @ts-ignore regex tested above
      const code = incomingMessageBody.match(regexFor6ConsecutiveDigits)[0];
      const verification = await checkVerification(
        attendeeRecord.checkSid,
        code,
      );
      if (!verification.valid) {
        sendMessage(
          sender,
          getInvalidVerificationCodeMessage(eventLang(event)),
        );
        return true;
      }

      const [, segmentData] = await Promise.all([
        // getReadyToOrderMessage is fetched inside sendReadyToOrder
        Promise.resolve(),
        checkSegmentTraits(attendeeRecord.email),
      ]);

      const { SEGMENT_TRAIT_CHECK = "" } = process.env;
      await updateSyncMapItem(
        NEXT_PUBLIC_ATTENDEES_MAP,
        phone,
        {
          stage: Stages.VERIFIED_USER,
          ...(SEGMENT_TRAIT_CHECK
            ? { [SEGMENT_TRAIT_CHECK]: (segmentData as any)[SEGMENT_TRAIT_CHECK] }
            : {}),
          foundInSegment: segmentData.foundInSegment,
        },
        TwoWeeksInSeconds,
      );

      await sendReadyToOrder(sender, event, false);
      return true;
    } catch (error) {
      console.error(error);
      sendMessage(
        sender,
        getInvalidVerificationCodeMessage(eventLang(event)),
      );
      return true;
    }
  }

  return false;
}
