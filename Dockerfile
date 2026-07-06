FROM node:24-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

RUN corepack enable

FROM base AS deps

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder

ARG TWILIO_API_KEY
ARG TWILIO_API_SECRET
ARG TWILIO_ACCOUNT_SID
ARG TWILIO_SYNC_SERVICE_SID

ENV TWILIO_API_KEY=$TWILIO_API_KEY
ENV TWILIO_API_SECRET=$TWILIO_API_SECRET
ENV TWILIO_ACCOUNT_SID=$TWILIO_ACCOUNT_SID
ENV TWILIO_SYNC_SERVICE_SID=$TWILIO_SYNC_SERVICE_SID
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm exec next build

FROM node:24-slim AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

WORKDIR /app

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
