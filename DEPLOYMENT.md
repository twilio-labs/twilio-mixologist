# Deploy to Azure Container Apps

This guide deploys Twilio Mixologist to Azure Container Apps with public HTTPS ingress so Twilio can call `/webhooks/messaging`.

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
TWILIO_VERIFY_SERVICE_SID="VAxxxxx"
TWILIO_SYNC_SERVICE_SID="ISxxxxx"
TWILIO_MESSAGING_SERVICE_SID="MGxxxxx"
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

The script runs non-interactively and uses these defaults unless overridden via environment variables:

- Azure resource group: `AZURE_RESOURCE_GROUP` (default `rg-twilio-mixologist`)
- Azure region: `AZURE_LOCATION` (default `northeurope`)
- Azure Container Registry name: `AZURE_ACR_NAME` (default derived from the app name)
- Container App name: `AZURE_CONTAINER_APP_NAME` (default `twilio-mixologist`)
- Container Apps environment name: `AZURE_CONTAINER_ENV_NAME` (default `cae-twilio-mixologist`)

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
Twilio webhook: https://<your-app-fqdn>/webhooks/messaging
```

In Twilio Console, configure your WhatsApp or SMS sender incoming message webhook:

```text
https://<your-app-fqdn>/webhooks/messaging
```

## 5. Verify

Open the app:

```sh
curl -i "https://<your-app-fqdn>/"
```

Check the incoming webhook route:

```sh
curl -i "https://<your-app-fqdn>/webhooks/messaging"
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

## 6. CI Deployment (GitHub Actions)

`.github/workflows/deploy.yml` runs `./deploy.sh` automatically on every push to `main`
(i.e. whenever a PR is merged), authenticating to Azure via OIDC instead of `az login`.

This repo's Actions policy only allows GitHub-owned actions, so the workflow performs
the OIDC token exchange by hand rather than via `azure/login`. For it to work, an Azure
AD App Registration needs a federated credential trusting this repo's `main` branch
(**Certificates & secrets → Federated credentials**, entity type "Branch", branch `main`),
with the **Contributor** role on the target subscription/resource group. Then set these
as repo secrets:

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

The workflow also writes a `.env.local` file from repo secrets/variables before calling
`deploy.sh`, mirroring the variables in `sample.env`. Add any missing ones (e.g.
`OPENAI_API_KEY`, `SEGMENT_PROFILE_KEY`, `BADGE_API_KEY`) as repo secrets, or as repo
variables for non-sensitive values, so they're picked up the same way.

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
export AZURE_RESOURCE_GROUP="rg-twilio-mixologist"
export AZURE_LOCATION="northeurope"
export AZURE_ACR_NAME="twiliomixologistacr"
export AZURE_CONTAINER_APP_NAME="twilio-mixologist"
export AZURE_CONTAINER_ENV_NAME="cae-twilio-mixologist"
export AZURE_LOG_ANALYTICS_WORKSPACE="logs-twilio-mixologist"
export IMAGE_NAME="twilio-mixologist"
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
