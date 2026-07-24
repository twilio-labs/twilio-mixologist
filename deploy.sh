#!/usr/bin/env bash
set -euo pipefail

APP_PORT="${APP_PORT:-3000}"
DEFAULT_LOCATION="${DEFAULT_LOCATION:-northeurope}"
DEFAULT_RESOURCE_GROUP="${DEFAULT_RESOURCE_GROUP:-rg-twilio-mixologist}"
DEFAULT_APP_NAME="${DEFAULT_APP_NAME:-twilio-mixologist}"
DEFAULT_ENV_NAME="${DEFAULT_ENV_NAME:-cae-twilio-mixologist}"
DEFAULT_IMAGE_NAME="${DEFAULT_IMAGE_NAME:-twilio-mixologist}"

ENV_FILE="${ENV_FILE:-.env.local}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

require_command() {
  local cmd="$1"

  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command: $cmd" >&2
    exit 1
  fi
}

secret_name_for() {
  echo "$1" | tr '[:upper:]_' '[:lower:]-'
}

if [[ ! -f "$ENV_FILE" && -f ".env" ]]; then
  ENV_FILE=".env"
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing environment file: $ENV_FILE" >&2
  echo "Create .env.local from sample.env, or set ENV_FILE=/path/to/env before running." >&2
  exit 1
fi

require_command az

if ! az account show >/dev/null 2>&1; then
  echo "You are not signed in to Azure. Opening Azure CLI login..."
  az login --output none
fi

echo "Loading app configuration from $ENV_FILE"
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

AZURE_RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-}"
AZURE_LOCATION="${AZURE_LOCATION:-}"
AZURE_ACR_NAME="${AZURE_ACR_NAME:-}"
AZURE_CONTAINER_APP_NAME="${AZURE_CONTAINER_APP_NAME:-}"
AZURE_CONTAINER_ENV_NAME="${AZURE_CONTAINER_ENV_NAME:-}"
AZURE_LOG_ANALYTICS_WORKSPACE="${AZURE_LOG_ANALYTICS_WORKSPACE:-}"
AZURE_USER="${AZURE_USER:-}"
IMAGE_NAME="${IMAGE_NAME:-$DEFAULT_IMAGE_NAME}"

AZURE_RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-$DEFAULT_RESOURCE_GROUP}"
AZURE_LOCATION="${AZURE_LOCATION:-$DEFAULT_LOCATION}"
AZURE_CONTAINER_APP_NAME="${AZURE_CONTAINER_APP_NAME:-$DEFAULT_APP_NAME}"
AZURE_CONTAINER_ENV_NAME="${AZURE_CONTAINER_ENV_NAME:-$DEFAULT_ENV_NAME}"

if [[ -z "$AZURE_ACR_NAME" ]]; then
  AZURE_ACR_NAME="$(echo "${AZURE_CONTAINER_APP_NAME}acr" | tr -cd '[:alnum:]' | tr '[:upper:]' '[:lower:]')"
  AZURE_ACR_NAME="${AZURE_ACR_NAME:0:40}"
fi

if [[ -z "$AZURE_LOG_ANALYTICS_WORKSPACE" ]]; then
  AZURE_LOG_ANALYTICS_WORKSPACE="logs-$AZURE_CONTAINER_APP_NAME"
fi

if [[ -z "$AZURE_USER" ]]; then
  AZURE_USER="$(az account show --query user.name --output tsv)"
fi

echo "Ensuring Azure Container Apps extension is installed"
az extension add --name containerapp --upgrade --output none

if ! az group show --name "$AZURE_RESOURCE_GROUP" >/dev/null 2>&1; then
  echo "Creating resource group: $AZURE_RESOURCE_GROUP"
  az group create \
    --name "$AZURE_RESOURCE_GROUP" \
    --location "$AZURE_LOCATION" \
    --tags created_by="$AZURE_USER" \
    --output none
fi

ACR_LOGIN_SERVER="$(az acr show \
  --name "$AZURE_ACR_NAME" \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --query loginServer \
  --output tsv 2>/dev/null || true)"

if [[ -z "$ACR_LOGIN_SERVER" ]]; then
  echo "Creating Azure Container Registry: $AZURE_ACR_NAME"
  az acr create \
    --name "$AZURE_ACR_NAME" \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --location "$AZURE_LOCATION" \
    --sku Basic \
    --admin-enabled true \
    --tags created_by="$AZURE_USER" \
    --output none

  ACR_LOGIN_SERVER="$(az acr show \
    --name "$AZURE_ACR_NAME" \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --query loginServer \
    --output tsv)"
fi

build_arg_keys=(
  TWILIO_API_KEY
  TWILIO_API_SECRET
  TWILIO_ACCOUNT_SID
  TWILIO_SYNC_SERVICE_SID
)

build_args=()
for key in "${build_arg_keys[@]}"; do
  value="${!key:-}"
  escaped_value="$(printf '%q' "$value")"
  build_args+=(--build-arg "$key=$escaped_value")
done

echo "Building image in ACR: $IMAGE_NAME:$IMAGE_TAG"
az acr build \
  --registry "$AZURE_ACR_NAME" \
  --image "$IMAGE_NAME:$IMAGE_TAG" \
  "${build_args[@]}" \
  .

# Resolve the exact digest so the container app always pulls the new image.
# Using a floating tag like :latest causes Azure to reuse the old revision
# when the tag string hasn't changed, even if the underlying image has.
IMAGE_DIGEST="$(az acr repository show \
  --name "$AZURE_ACR_NAME" \
  --image "$IMAGE_NAME:$IMAGE_TAG" \
  --query digest \
  --output tsv)"
REMOTE_IMAGE="$ACR_LOGIN_SERVER/$IMAGE_NAME@$IMAGE_DIGEST"
echo "Deploying image digest: $IMAGE_DIGEST"

if ! az containerapp env show \
  --name "$AZURE_CONTAINER_ENV_NAME" \
  --resource-group "$AZURE_RESOURCE_GROUP" >/dev/null 2>&1; then
  if ! az monitor log-analytics workspace show \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --workspace-name "$AZURE_LOG_ANALYTICS_WORKSPACE" >/dev/null 2>&1; then
    echo "Creating Log Analytics workspace: $AZURE_LOG_ANALYTICS_WORKSPACE"
    az monitor log-analytics workspace create \
      --resource-group "$AZURE_RESOURCE_GROUP" \
      --workspace-name "$AZURE_LOG_ANALYTICS_WORKSPACE" \
      --location "$AZURE_LOCATION" \
      --tags created_by="$AZURE_USER" \
      --output none
  fi

  LOG_ANALYTICS_CUSTOMER_ID="$(az monitor log-analytics workspace show \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --workspace-name "$AZURE_LOG_ANALYTICS_WORKSPACE" \
    --query customerId \
    --output tsv)"
  LOG_ANALYTICS_SHARED_KEY="$(az monitor log-analytics workspace get-shared-keys \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --workspace-name "$AZURE_LOG_ANALYTICS_WORKSPACE" \
    --query primarySharedKey \
    --output tsv)"

  echo "Creating Container Apps environment: $AZURE_CONTAINER_ENV_NAME"
  az containerapp env create \
    --name "$AZURE_CONTAINER_ENV_NAME" \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --location "$AZURE_LOCATION" \
    --logs-workspace-id "$LOG_ANALYTICS_CUSTOMER_ID" \
    --logs-workspace-key "$LOG_ANALYTICS_SHARED_KEY" \
    --tags created_by="$AZURE_USER" \
    --output none
fi

# Allow deploy-specific credential overrides
ADMIN_LOGIN="${DEPLOY_ADMIN_LOGIN:-$ADMIN_LOGIN}"
MIXOLOGIST_LOGIN="${DEPLOY_MIXOLOGIST_LOGIN:-$MIXOLOGIST_LOGIN}"
KIOSK_LOGIN="${DEPLOY_KIOSK_LOGIN:-$KIOSK_LOGIN}"

secret_keys=(
  TWILIO_ACCOUNT_SID
  TWILIO_API_KEY
  TWILIO_API_SECRET
  TWILIO_AUTH_TOKEN
  TWILIO_MESSAGING_SERVICE_SID
  TWILIO_SYNC_SERVICE_SID
  TWILIO_VERIFY_SERVICE_SID
  OPENAI_API_KEY
  ADMIN_LOGIN
  MIXOLOGIST_LOGIN
  KIOSK_LOGIN
  PUBLIC_BASE_URL
  # Required for QR mode (LEAD_COLLECTION=QR):
  TWILIO_CONVERSATION_CONFIGURATION_ID
  TWILIO_MEMORY_STORE_ID
  # Optional: Segment Profiles enrichment
  SEGMENT_SPACE_ID
  SEGMENT_PROFILE_KEY
  # Optional: badge scan API key (QR mode)
  BADGE_API_KEY
)

plain_keys=(
  SERVICE_INSTANCE_PREFIX
  LEAD_COLLECTION
  EVENT_NAME
  SEGMENT_TRAIT_CHECK
  UNLIMITED_ORDERS
)

secret_args=()
secret_env_vars=()
for key in "${secret_keys[@]}"; do
  value="${!key:-}"
  if [[ -n "$value" ]]; then
    secret_name="$(secret_name_for "$key")"
    secret_args+=("$secret_name=$value")
    secret_env_vars+=("$key=secretref:$secret_name")
  fi
done

plain_env_vars=()
for key in "${plain_keys[@]}"; do
  value="${!key:-}"
  if [[ -n "$value" ]]; then
    plain_env_vars+=("$key=$value")
  fi
done

if [[ -z "${PORT:-}" ]]; then
  plain_env_vars+=("PORT=$APP_PORT")
fi

registry_username="$(az acr credential show \
  --name "$AZURE_ACR_NAME" \
  --query username \
  --output tsv)"
registry_password="$(az acr credential show \
  --name "$AZURE_ACR_NAME" \
  --query 'passwords[0].value' \
  --output tsv)"

env_vars=("${plain_env_vars[@]}" "${secret_env_vars[@]}")

_do_create_container_app() {
  echo "Creating Container App: $AZURE_CONTAINER_APP_NAME"
  create_args=(
    --name "$AZURE_CONTAINER_APP_NAME"
    --resource-group "$AZURE_RESOURCE_GROUP"
    --environment "$AZURE_CONTAINER_ENV_NAME"
    --image "$REMOTE_IMAGE"
    --target-port "$APP_PORT"
    --ingress external
    --registry-server "$ACR_LOGIN_SERVER"
    --registry-username "$registry_username"
    --registry-password "$registry_password"
    --tags created_by="$AZURE_USER"
  )

  if [[ ${#secret_args[@]} -gt 0 ]]; then
    create_args+=(--secrets "${secret_args[@]}")
  fi

  if [[ ${#env_vars[@]} -gt 0 ]]; then
    create_args+=(--env-vars "${env_vars[@]}")
  fi

  az containerapp create "${create_args[@]}" --output none
}

_do_update_container_app() {
  echo "Updating Container App: $AZURE_CONTAINER_APP_NAME"

  if [[ ${#secret_args[@]} -gt 0 ]]; then
    az containerapp secret set \
      --name "$AZURE_CONTAINER_APP_NAME" \
      --resource-group "$AZURE_RESOURCE_GROUP" \
      --secrets "${secret_args[@]}" \
      --output none
  fi

  update_args=(
    --name "$AZURE_CONTAINER_APP_NAME"
    --resource-group "$AZURE_RESOURCE_GROUP"
    --image "$REMOTE_IMAGE"
  )

  if [[ ${#env_vars[@]} -gt 0 ]]; then
    update_args+=(--set-env-vars "${env_vars[@]}")
  fi

  az containerapp update "${update_args[@]}" --output none

  az containerapp ingress enable \
    --name "$AZURE_CONTAINER_APP_NAME" \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --type external \
    --target-port "$APP_PORT" \
    --output none

  az containerapp registry set \
    --name "$AZURE_CONTAINER_APP_NAME" \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --server "$ACR_LOGIN_SERVER" \
    --username "$registry_username" \
    --password "$registry_password" \
    --output none
}

_err_tmp="$(mktemp)"
if az containerapp show \
  --name "$AZURE_CONTAINER_APP_NAME" \
  --resource-group "$AZURE_RESOURCE_GROUP" >/dev/null 2>&1; then
  _do_update_container_app 2>"$_err_tmp" || {
    if grep -qi "does not exist" "$_err_tmp"; then
      echo "Container app disappeared during update, creating instead..."
      _do_create_container_app
    else
      cat "$_err_tmp" >&2
      rm -f "$_err_tmp"
      exit 1
    fi
  }
else
  _do_create_container_app
fi
rm -f "$_err_tmp"

echo "Setting replica scale to 1/1"
az containerapp update \
  --name "$AZURE_CONTAINER_APP_NAME" \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --min-replicas 1 \
  --max-replicas 1 \
  --output none

FQDN="$(az containerapp show \
  --name "$AZURE_CONTAINER_APP_NAME" \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --query properties.configuration.ingress.fqdn \
  --output tsv)"

echo
echo "Deployment complete"
echo "App URL: https://$FQDN"
echo "Twilio webhook: https://$FQDN/webhooks/messaging"
echo
echo "Useful checks:"
echo "  curl -i https://$FQDN/"
echo "  az containerapp logs show -g $AZURE_RESOURCE_GROUP -n $AZURE_CONTAINER_APP_NAME --follow"
