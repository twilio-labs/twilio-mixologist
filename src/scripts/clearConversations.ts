import twilio from "twilio";
// import throttledQueue from "throttled-queue";
import { deleteConversation } from "@/lib/twilio";

const {
  TWILIO_API_KEY = "",
  TWILIO_API_SECRET = "",
  TWILIO_ACCOUNT_SID = "",
  TWILIO_CONVERSATIONS_SERVICE_SID = "",
} = process.env;

// const throttle = throttledQueue(20, 1000); // 20 requests per second
const client = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
  accountSid: TWILIO_ACCOUNT_SID,
});

if (!TWILIO_CONVERSATIONS_SERVICE_SID) {
  throw new Error("Missing sid for for conversations service");
}

(async () => {
  const list = await client.conversations.v1.conversations.list({
    limit: 500,
  });

  for await (const conversation of list) {
    await deleteConversation(conversation.sid);
    console.log(`Deleting conversation with SID: ${conversation.sid}`);
  }

  // const conversationsPage =
  //   await client.conversations.v1.participantConversations.page({});

  // let counter = 0;

  // while (conversationsPage && conversationsPage.instances.length > 0) {
  //   conversationsPage.instances.map((item) => {
  //     counter++;
  //     throttle(async () => {
  //       return deleteConversation(item.conversationSid);
  //     });
  //   });

  //   // @ts-ignore
  //   conversationsPage = await conversationsPage.nextPage();
  // }

  // throttle(() => {
  //   console.log(`Removed ${counter} conversations`);
  // });
})();
