<p align="center">
  <img src="client/assets/icons/android-chrome-192x192.png">
  <h1 align="center">Twilio Barista</h1>
</p>

> :construction: This version is still very much work in progress. The setup instructions and documentation will follow soon :construction:

# About

Twilio Barista is an application that allows you to solve the problem of long queues at barista stands at events. Attendees can order their coffee via various Twilio-powered channels, baristas get all orders on a website that can be loaded via a tablet and once an order is done the attendee will be notified via the system to come and pick it up. No more queueing and efficient coffee ☕️ ordering! 🎉

Different versions of this system have been used at events such as:
- [NDC Oslo](https://ndcoslo.com) 2016, 2017
- [CSSConf EU](https://2017.cssconf.eu/) && [JSConf EU](https://2017.jsconf.eu/) 2017

# Features

- Receive orders using [Twilio Messaging]
- Store orders and real-time synchronization them between back-end and front-end using [Twilio Sync]
- Easy dynamic application configuration using [Twilio Sync]
- Dynamic phone number acquisition/configuration using the [Twilio REST API]
- Sending bulk notifications to different user segments on different channels using [Twilio Notify]
- Permission management based on [Twilio Sync]
- Top PWA support thanks to [Preact CLI] based front-end
- Easy way to reset the application from the admin interface

## Channels

The current [Twilio Channels] are:
- [SMS][Twilio SMS]

# Setup

## Requirements
- [Node.js] version 8.1 or higher
- [npm]
- A Twilio account - [Sign up here](https://www.twilio.com/try-twilio)

## Twilio Configuration

### 0. Know your Twilio Account SID
Retrieve your Twilio Account SID from the [Twilio Console].

### 1. Generate a Twilio API Key and Secret
Go into the [Twilio Console] and [generate an API Key and Secret](https://www.twilio.com/console/dev-tools/api-keys). Make sure to store the information safely.

### 2. Create a Messaging Service
Create a [Messaging Service in the Twilio Console](https://www.twilio.com/console/sms/services) and store the SID.

### 3. Create a Notify Service
Create a [Notify Service in the Twilio Console](https://www.twilio.com/console/notify/services) and choose your created Messaging Service as a Messaging Service. Make sure to store the SID.

### 4. Create a Sync Service
Create a [Sync Service in the Twilio Console](https://www.twilio.com/console/sync/services) and store the SID.

## Manual

### 1. Clone project and install dependencies
```bash
git clone git@github.com:dkundel/twilio-barista.git
cd twilio-barista
npm install
```

### 2. Configure environment variables
The following environment variables are necessary for Twilio Barista:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_MESSAGING_SERVICE`
- `TWILIO_SYNC_SERVICE`
- `TWILIO_NOTIFY_SERVICE`
- `PHONE_NUMBER_HASHING_SECRET` - This will be used to generate internal identities based on the phone number
- `LOGINS` - Semi-colon separated list based on the following schema: `username,password,role`. Available roles are:
  - `barista` - Enables you to see all orders but nothing else
  - `admin` - Can see and write all data
- `PORT` - Optional. By default it will run on port `3000`

#### a) For development
Copy the `.env.example` file into a `.env` file. And set the respective values in the file.

#### b) For production
[Set the environment variables](https://www.twilio.com/blog/2017/01/how-to-set-environment-variables.html) based on your operating system or hosting provider.

### 3. Start up server

#### a) Automatic detection of environment
```bash
npm start
```
If `NODE_ENV` is set to `production` the server will automatically start in production mode else it will load the `.env` file for the variables using [node-env-run].

#### b) Explicit development mode
```bash
npm run start:dev
```

#### c) Explicit production mode
```bash
npm run start:prod
```

### 4. Setup application
Navigate to your deployment on an externally available URL. If you are hosting for testing on your localhost you should use [ngrok] to create a tunnel.

Authenticate with an admin user, go into the Admin section and under Other click the **Setup** button. This will configure the rest.

### 5. Acquire phone numbers
Choose in the Admin section under Other a country that you want a phone number from and click acquire. It will purchase the number, configure it and you can see it in the Configuration section of your Admin part under `connectedPhoneNumbers`.

### 6. You are ready for some ☕️ action!
You are all set. People can start sending in messages to those numbers and you will receive them in the order section of your interface.

# Project Structure

The project is split up into three sections on the top level. The `client` directory contains all front-end related code and has been bootstrapped with the [Preact CLI]. The `server` directory contains anything backend related and is powered by [Express]. The `shared` folder contains any code that is being used by both parts of the project.

There is also a `client-dist` directory that contains the latest stable build of the front-end with the `production` flag enabled.

You can find more information in the [documentation] of the project.

# Code of Conduct
Please be aware that this project has a [Code of Conduct](CODE_OF_CONDUCT.md). The tldr; is to just be excellent to each other ❤️

# Contributing

You are more than welcome to contribute to this project. The tests for this project are still missing so please properly test your changes manually in the mean time.

## Building front-end changes
To build changes for the front-end you can run the following command:
```bash
npm run build:preact
```

This will build the directory into the `client-dist` directory. Start off the API server to fully test it. If you want to just serve the front-end with limited functionality you can use this command to serve:
```bash
npm run serve:preact
```

## Running the backend
Simply run the server as you are used to with:
```bash
npm start
```

# Special Thanks To
A special thanks to all the awesome folks in the open source community and their great projects and especially the folks working on the following projects:
- [`preact`](https://github.com/developit/preact), [`preact-cli`](https://github.com/developit/preact-cli), [`preact-router`](https://github.com/developit/preact-router), [`preact-mdl`](https://github.com/developit/preact-mdl)
- [`express`](https://github.com/expressjs/express)
- [`lodash`](https://github.com/lodash/lodash)
- [`pino`](https://github.com/pinojs/pino), [`express-pino-logger`](https://github.com/pinojs/express-pino-logger), [`pino-colada`](https://github.com/lrlna/pino-colada)
- [`prettier`](https://github.com/prettier/prettier)
- [`webpack`](https://github.com/webpack/webpack)
- [`moment`](https://github.com/moment/moment/)
- many more 🙂

# License

MIT © Dominik Kundel

# Contributors

- [Dominik Kundel](https://github.com/dkundel)

[Twilio Console]: https://www.twilio.com/console
[Twilio REST API]: https://www.twilio.com/docs/api/rest
[Twilio Messaging]: https://www.twilio.com/messaging
[Twilio SMS]: https://www.twilio.com/sms
[Twilio Notify]: https://www.twilio.com/notify
[Twilio Sync]: https://wwww.twilio.com/sync
[Twilio Channels]: https://www.twilio.com/channels
[Preact CLI]: https://github.com/developit/preact-cli
[Node.js]: https://nodejs.org
[npm]: https://npmjs.com
[node-env-run]: https://github.com/dkundel/node-env-run
[ngrok]: https://ngrok.com/
[Express]: http://expressjs.com/
[documentation]: docs/README.md