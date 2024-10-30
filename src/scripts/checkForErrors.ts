import twilio from "twilio";

const {
  TWILIO_API_KEY = "",
  TWILIO_API_SECRET = "",
  TWILIO_ACCOUNT_SID = "",
  TWILIO_MESSAGING_SERVICE_SID = "",
} = process.env;

// extend this list manually as needed
const ERROR_DICTONARY: any = {
  21610: 'The user has responded with "STOP"',
  21408: "Sent to a disabled region (Geo-Permissions settings)",
  30008: "Unknown error",
  63013: "Violates Channel provider's policy",
  63016: "Failed to send freeform message outside the window",
};

function timeSince(date: Date) {
  // @ts-ignore
  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = seconds / 31536000;

  if (interval > 1) {
    return Math.floor(interval) + " years ago";
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + " months ago";
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + " days ago";
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + " hours ago";
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + " minutes ago";
  }
  return Math.floor(seconds) + " seconds ago";
}

const client = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
  accountSid: TWILIO_ACCOUNT_SID,
});

(async () => {
  let messagesPage = await client.messages.page({});

  console.log("Time since sent | Message SID | Error code | Error description");
  while (messagesPage && messagesPage.instances.length > 0) {
    const errors = messagesPage.instances.forEach((message: any) => {
      if (
        message.errorCode !== null &&
        message.messagingServiceSid === TWILIO_MESSAGING_SERVICE_SID
      ) {
        console.log(
          `${timeSince(message.dateCreated)} | ${message.sid} | ${message.errorCode} | ${ERROR_DICTONARY[message.errorCode]} `,
        );
      }
    });

    // @ts-ignore
    messagesPage = await messagesPage.nextPage();
  }

  console.log("Go to https://console.twilio.com/us1/monitor/logs/sms to see more details about a given message");
  console.log("Also check https://console.twilio.com/us1/monitor/logs/debugger/errors for other errors");
})();
