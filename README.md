# Twilio Barista

Ahoy there coffee fanatics! 

Anyone who has been to a conference knows the pressure of trying to grab your coffee before the next session starts.  You come out of your session room and run smack into the coffee queue.

Twilio Barista is a simple Node.js and Express application that solves this problem by letting you place your coffee order via text message or Facebook Messenger* and then notifying you once your coffee is ready.  No more queuing for coffee!

 <sub>\* Available to participants in Twilios [Facebook Messenger Integration Developer Preview](https://www.twilio.com/messaging-apps)</sub> 

## Requirements

In order to run your own Twilio Barista you'll need:

- A [Twilio account](http://twilio.com/try-twilio)
- A [Pusher account](https://pusher.com/)
- At least one barista ☕️

## Setup

### The Espresso Way

If you don't want to clone the repository and configure everything on your own machine but just get going use the deploy to Heroku button below and follow the instructions.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

### The Latte Macchiato Way

If you want to set this up on your own machine, get started by cloning this repository. Afterwards copy the `.env.example` into `.env` and update the configuration values with your Twilio account credentials, Pusher account credentials and a username and password used to restrict access to portions of the Barista application:

```bash
# These are the credentials to log into your Twilio Barista Application
LOGIN_USERNAME=
LOGIN_PASSWORD=

# These are your Twilio account credentials
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=

# These are your Pusher application credentials
PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
```

Alternatively you can store these directly in [environment variables](https://www.twilio.com/blog/2017/01/how-to-set-environment-variables.html).

Start of the server with `npm run dev` to load the configuration from the `.env` file and `npm start` to start it normally without the values from `.env`.

Twilio Barista is now ready to accept coffee orders, but before we can do that we need to configure Twilio to send incoming text and Facebook messages to our app.  Lets do that next.

## Configuring Twilio 

Twilio Barista supports two methods of placing orders: 

1. sending a text message to a Twilio phone number or 
2. sending a message through Facebook Messenger from your Facebook page
 
Both types of messages use the same mechanism to let Twilio Barista know about the incoming message, a public URL. 

Twilio will make an HTTP request to these URLs any time it receives an incoming text or Facebook Messenger message.  Included in these HTTP requests are details like the incoming message text and the sender of the message which Twilio Barista uses to create a coffee order.

Twilio Barista already includes a route (`/incoming`) that can accept, process and reply to incoming SMS and Facebook messages so all you need to do is make that route publicly accessible.  Do that by deploying Twilio Barista to your favorite web host or by using a tool like [ngrok](https://ngrok.com/) to expose your own local web server to the internet through a public host name.

![](http://i.imgur.com/hptQKir.png)

With your public URL in hand you can configure Twilio to accept incoming SMS messages or Facebook Messenger messages.

### Configure SMS

To configure ordering via SMS head to the [Phone Numbers](https://www.twilio.com/console/phone-numbers) section of your [Twilio Console](https://www.twilio.com/console) and [buy a new phone number](https://www.twilio.com/console/phone-numbers/search).

Once purchased, configure the phone numbers Messaging Webhook with your public URL:

![](http://i.imgur.com/502WMWR.png)

Save the phone number configuration and give Twilio Barista a test by sending a text message to your new phone number.

### Configure Facebook Messenger 

To configure ordering via Facebook Messenger configure your Facebook integration via the Twilio Console and set the Request URL to your public URL.

Open Facebook and send a message to your page via Messenger.

## License

MIT

## Contributors

- Dominik Kundel <dkundel@twilio.com>
- Marcos Placona