# Configuration

## Dynamic configuration

These values can be changed in the configuration document.

| Key | Type | Default Value | Description |
| --- | ---- | ------------- | ----------- |
| `isOnline` | `boolean` | `true` | If set to `false` it will return offline messages for incoming messages and don't trigger the classical actions. |
| `connectedPhoneNumbers` | `string[]` | `[]` | List of phone numbers connected to the messaging service. This gets populated when the server starts up. |
| `offlineMessage` | `string` | `''` | Allows to customize the offline message instead of using the default ones. |
| `availableCoffees` | `object` | `AVAILABLE_DEFAULT_OPTIONS` in [consts file] | This is a map of coffees available in the system. |
| `availableCoffees['Name of Coffee']` | `boolean` | `true` | If set to `true` this coffee is available. |
| `spellingMap` | `object` | `SPELLING_MISTAKES` in [consts file] | This is the map that is used to determine the order from the incoming message |
| `spellingMap['Spelling of Coffee']` | `string` | | Maps to the string of a value in `availableCoffees` |
| `repoUrl` | `string | 'https://github.com/dkundel/twilio-barista` | The link the repo that should be sent in the response messages |

## Static configuration 

These values can be configured via environment variables.

| Environment Variable Name | Description |
| ------------------------- | ----------- |
| `PORT` | Port that the server should be running on. Defaults to `3000` |
| `LOGINS` | Semicolon-separated list of users in the schema `username,password,role`. Roles available are admin and barista |
| `PHONE_NUMBER_HASHING_SECRET` | Secret that is being used to generate the identities of the users based on their phone numbers |
| `TWILIO_ACCOUNT_SID` | Your Twilio Account SID. www.twilio.com/console |
| `TWILIO_API_KEY` | Your Twilio API Key. www.twilio.com/console/dev-tools/api-keys |
| `TWILIO_API_SECRET` | Your Twilio API Key. www.twilio.com/console/dev-tools/api-keys |
| `TWILIO_MESSAGE_SERVICE` | Your Twilio Message Service SID. www.twilio.com/console/sms/services |
| `TWILIO_NOTIFY_SERVICE` | Your Twilio Notify Service SID. www.twilio.com/console/notify/services |
| `TWILIO_SYNC_SERVICE` | Your Twilio Sync Service SID. www.twilio.com/console/sync/services |

[consts file]: ../shared/consts