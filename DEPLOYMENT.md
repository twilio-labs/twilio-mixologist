# Deploy to Azure Container Apps

This guide deploys Wheel of Twilio to Azure Container Apps with public HTTPS ingress so Twilio can call `/api/incoming`.

## Prerequisites

- Azure subscription
- Azure CLI installed
- Twilio credentials and service SIDs
- `.env.local` created from `sample.env`

## 1. Configure Environment

Create your local environment file:

```sh
cp sample.env .env.local
```

Edit `.env.local` and fill in the required Twilio values:

```sh
TWILIO_ACCOUNT_SID="ACxxxxx"
TWILIO_API_KEY="SKxxxxx"
TWILIO_API_SECRET="xxxxx"
VERIFY_SERVICE_SID="VAxxxxx"
SYNC_SERVICE_SID="ISxxxxx"
MESSAGING_SERVICE_SID="MGxxxxx"
NEXT_PUBLIC_TWILIO_PHONE_NUMBER="+15551234567"
```

The deploy script uses `.env.local` for both build-time values, such as `NEXT_PUBLIC_*`, and runtime environment variables.

## 2. Sign In to Azure

```sh
az login
```

The script automatically installs or updates the Azure Container Apps CLI extension.

## 3. Deploy

Run the deploy script from the repository root:

```sh
./deploy.sh
```

The script prompts for:

- Azure resource group
- Azure region
- Azure Container Registry name
- Container App name
- Container Apps environment name

You can press Enter to accept the defaults.

The script creates or updates:

- Resource group
- Azure Container Registry
- Log Analytics workspace
- Container Apps environment
- Container App with external ingress on port `3000`

Sensitive values such as `TWILIO_API_SECRET`, `BASIC_AUTH_PASSWORD`, and `SEGMENT_PROFILE_KEY` are configured as Container App secrets. The app is pinned to one replica because event runtime state should not fan out unexpectedly.

## 4. Configure Twilio

When deployment finishes, the script prints:

```text
App URL: https://<your-app-fqdn>
Twilio incoming webhook: https://<your-app-fqdn>/api/incoming
```

In Twilio Console, configure your WhatsApp or SMS sender incoming message webhook:

```text
https://<your-app-fqdn>/api/incoming
```

## 5. Verify

Open the app:

```sh
curl -i "https://<your-app-fqdn>/"
```

Check the incoming webhook route:

```sh
curl -i "https://<your-app-fqdn>/api/incoming"
```

Stream logs:

```sh
az containerapp logs show \
  --resource-group "<your-resource-group>" \
  --name "<your-container-app-name>" \
  --follow
```

Check ingress:

```sh
az containerapp show \
  --resource-group "<your-resource-group>" \
  --name "<your-container-app-name>" \
  --query "properties.configuration.ingress.{external:external,fqdn:fqdn,targetPort:targetPort}" \
  --output json
```

Expected ingress values:

- `external`: `true`
- `targetPort`: `3000`

## Optional Local Docker Check

Before deploying, you can build and run the container locally:

```sh
docker compose --env-file .env.local build
docker compose --env-file .env.local up
```

Open `http://localhost:3000`.

## Optional Overrides

Set these before running `./deploy.sh` if you do not want to use the prompts:

```sh
export AZURE_RESOURCE_GROUP="wheel-of-twilio-rg"
export AZURE_LOCATION="northeurope"
export AZURE_ACR_NAME="wheeloftwilioacr"
export AZURE_CONTAINER_APP_NAME="wheel-of-twilio"
export AZURE_CONTAINER_ENV_NAME="cae-wheel-of-twilio"
export AZURE_LOG_ANALYTICS_WORKSPACE="logs-wheel-of-twilio"
export IMAGE_NAME="wheel-of-twilio"
export IMAGE_TAG="latest"
export ENV_FILE=".env.local"
```

Good region choices:

- UK event: `uksouth`
- Germany or EU-first event: `northeurope`

## Troubleshooting

If the ACR build fails with `Request failed with status code 401` or `Failed to fetch Templates`, check that `.env.local` contains valid Twilio credentials.

If Azure blocks resource creation with `RequestDisallowedByPolicy` and mentions `tags['created_by']`, set `AZURE_USER` before running the script:

```sh
export AZURE_USER="your.name@example.com"
```

If the deployed URL shows a Container Apps 404 page, confirm ingress is external and the target port is `3000`. To repair it:

```sh
az containerapp ingress enable \
  --resource-group "<your-resource-group>" \
  --name "<your-container-app-name>" \
  --type external \
  --target-port 3000
```
