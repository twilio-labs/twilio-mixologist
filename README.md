<p align="center">
  <img src="resources/android-chrome-192x192.png">
  <h1 align="center">Twilio Mixologist</h1>
</p>

## About

Twilio Mixologist is an application that allows you to solve the problem of long queues at stands at events. Attendees can order their coffee, smoothie or whatever you serve via Twilio-powered channels, Mixologists get all orders on a website that can be accessed via a tablet and once an order is done the attendee will be notified via the system to come and pick it up. No more queueing and efficient coffee ☕️ ordering! 🎉

If you want to learn more about how this project was started, check out the this blog post:

> [Serving Coffee with Twilio Programmable SMS and React](https://www.twilio.com/en-us/blog/serving-coffee-with-sms-and-react-html)

Different versions of this system have been used at events such as:

- [NDC Oslo](https://ndcoslo.com) 2016, 2017
- [CSSConf EU](https://2017.cssconf.eu/) && [JSConf EU](https://2017.jsconf.eu/) 2017
- [WeAreDevelopers World Congress](https://www.wearedevelopers.com/world-congress) 2023, 2024
- [Mobile World Congress Barcelona](https://www.mwcbarcelona.com/) 2023, 2024
- [Money 20/20](https://www.money2020.com/) 2023
- [Twilio SIGNAL](https://signal.twilio.com/) 2023, 2024

## Features

- Receive orders using [Twilio Messaging]
- Store orders and real-time synchronization them between back-end and front-end using [Twilio Sync]
- Easy dynamic application configuration using [Twilio Sync]
- Managing message threads using [Twilio Conversations]
- Permission management based on [Twilio Sync]
- Easy way to reset the application from the admin interface
- Support multiple events that happen in parallel
- Query for location in the queue as well as canceling the order as a user
- All combined into a single [NextJS](https://nextjs.org/) web application

### Pending Features

- [ ] Integration with Segment
- [ ] Your suggestions

### Channels

The current [Twilio Channels] are:

- [WhatsApp][twilio whatsapp]
- [SMS][twilio messaging]

## Setup

### Requirements

- [Node.js] version 20 or higher
- [pnpm]
- A Twilio account - [Sign up here](https://www.twilio.com/try-twilio)

## Setup

1. Install the project's dependencies
   ```bash
   pnpm install
   ```
2. Create a `.env.local` files with, at least, the following

   ```
   # Application related values
   MIXOLOGIST_LOGIN=someuser:assword
   ADMIN_LOGIN=someadmin:password
   KIOSK_LOGIN=somekiosk:somepassword
   SERVICE_INSTANCE_PREFIX=Mixologist
   ACTIVE_CUSTOMERS_MAP=ActiveCustomers
   UNLIMITED_ORDERS=CommaSeparatedNumbersToWhichTheLimitDoesNotApply

   # NGROK URL GOES HERE
   PUBLIC_BASE_URL=https://mobert.ngrok.io

   # Twilio related values
   TWILIO_ACCOUNT_SID=
   TWILIO_API_KEY=
   TWILIO_API_SECRET=
   ```

   Go into the [Twilio Console] and [generate an API Key and Secret](https://www.twilio.com/console/dev-tools/api-keys). Make sure to store the information safely.

3. Run the setup script

   ```bash
   pnpm run create-twilio-res
   ```

4. Now you can manually add all the senders you need to the Messaging Services that was just created for you. This can be done in the [Twilio Console](https://twilio.com/console/messaging/services/)

5. Go to the Verify service and make sure it is able to [Send Email Verifications with Verify and Twilio SendGrid](https://www.twilio.com/docs/verify/email)

6. Connect your Messaging Service to your Conversation Service in the Twilio console.
   1. Turn on 'Handle Inbound Messages with Conversations' [here](https://console.twilio.com/us1/develop/conversations/manage/defaults)
   2. Set your default Mesaging Service and Conversation Services to the Services created by the setup script
   3. Head back to your Messaging Service, navigate to 'Integration' and select 'Autocreate a Conversation'
      P.S. In the future this setup step will no longer be necessary
7. Run the script to write the base config for the application. You can re-run this command whether you edit the configuration such as the menu ([`menus.ts`](./src/config/menus.ts)) or the spelling map ([`spellingMap.ts`](./src/config/spellingMap.ts)). It will also pick up changes you're done to the sender pool of the messaging service.

   ```bash
   pnpm run update-config
   ```

8. First, run the development server:

```bash
pnpm dev
```

9. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Testing

This projects comes with a test suit that runs on every push to `main` and `feat/` branches. Unit tests cover basic capabilities (access control checks, template generator). And e2e tests cover the main functionality of the website since the data is loaded async and RSC's are currently not supported by unit test frameworks.

```bash
pnpm test # run unit tests
pnpm test:e2e # run e2e tests
```

## Tips for production

Here are a few helpful notes:

- If you are using the SMS channel, make sure to [set the SMS Geo Permissions](https://www.twilio.com/docs/messaging/guides/sms-geo-permissions)to make sure senders from the entire world can interact with the Mixologist.
- Edit the [opt-out management settings](https://help.twilio.com/articles/360034798533-Getting-Started-with-Advanced-Opt-Out-for-Messaging-Services) of the messaging service to avoid that users accidentally unsubscribe from the list.
- Regularly run `pnpm check-for-errors` and see if unforeseen errors occurred when the users tried to order.
- The Kiosk interface is a self-service interface that you can make available to attendees via a table or phone. The page allows the manual entry of an order without the need to put a phone number down. This form can be accessed via `https://<mixologist.server>/<event-slug>/kiosk` and the credentials are defined in the environment variable `KIOSK_LOGIN`.

## How To Use

[Here's a diagram of what happens when the user sends a message to the application](resources/user-flow-diagram.png)

## Code of Conduct

Please be aware that this project has a [Code of Conduct](CODE_OF_CONDUCT.md). The tldr; is to just be excellent to each other ❤️

# Contributing to Twilio

All third party contributors acknowledge that any contributions they provide will be made under the same open source license that the open source project is provided under.

## Icons Used

- [Mixologist Icons by Oliver Pitsch](https://www.smashingmagazine.com/2016/03/freebie-Mixologist-iconset-50-icons-eps-png-svg/)
- [Bar by BirVa Mehta from Noun Project](https://thenounproject.com/term/bar/1323725/)

## License

MIT

[twilio console]: https://www.twilio.com/console
[twilio rest api]: https://www.twilio.com/docs/api/rest
[twilio messaging]: https://www.twilio.com/messaging
[twilio whatsapp]: https://www.twilio.com/en-us/messaging/channels/whatsapp
[twilio conversations]: https://www.twilio.com/conversations
[twilio sync]: https://wwww.twilio.com/sync
[twilio channels]: https://www.twilio.com/channels
[preact cli]: https://github.com/developit/preact-cli
[node.js]: https://nodejs.org
[nppm]: https://pnpm.io/
[ngrok]: https://ngrok.com/
[express]: http://expressjs.com/
