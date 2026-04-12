# Deployment & Monitoring Design

**Date:** 2026-04-12
**Status:** Approved

## Context

The price-track backend is an Express.js server (Node.js, CommonJS) that scrapes product prices and sends push/email notifications. It had a Dockerfile but no deployment config, no structured logging (only `console.log`), and no error tracking or monitoring. This design covers deploying it to Railway and adding full observability.

## Architecture

| Concern | Tool | Notes |
|---------|------|-------|
| Hosting | Railway | Docker-based, auto-deploy on push to main |
| Structured logs | Pino → BetterStack | JSON logs, queryable in BetterStack dashboard |
| Error tracking | Sentry | Crash reports, performance traces, request context |
| Uptime monitoring | BetterStack Uptime | Pings `GET /`, alerts on downtime |
| Infrastructure metrics | Railway dashboard | CPU, memory, network — built-in, free |

## Components

### `lib/logger.js`
Pino logger singleton. In production, ships JSON logs to BetterStack via `@logtail/pino` transport using `BETTERSTACK_SOURCE_TOKEN`. In development, pretty-prints colored output to stdout via `pino-pretty`.

### `lib/sentry.js`
Sentry initialization helper. Reads `SENTRY_DSN` from env. Exports `initSentry()` (called once at startup) and `Sentry` (for `captureException` in error handler). No-ops gracefully if `SENTRY_DSN` is not set.

### `middleware/request-logger.js`
Logs every HTTP request: method, path, status code, response time in ms. Listens on the response `finish` event to capture the final status.

### `middleware/error-handler.js`
Centralized Express error handler (4-argument signature). Logs the error with context, reports to Sentry via `captureException`, returns `{ error: 'Internal server error' }` with status 500. Replaces scattered inline error responses.

## Data Flow

```
Request → requestLogger → routes → (error thrown) → Sentry.expressErrorHandler → errorHandler
                                                                                    ↓
                                                                         logger.error + Sentry.captureException
```

Normal requests logged on response finish. Errors flow through Express's error chain.

## Environment Variables Added

| Variable | Purpose |
|----------|---------|
| `BETTERSTACK_SOURCE_TOKEN` | BetterStack log ingestion token |
| `SENTRY_DSN` | Sentry project DSN |
| `NODE_ENV` | Set to `production` on Railway |

## Railway Setup (manual)
1. New project → Deploy from GitHub → set root directory to `server/`
2. Add all env vars from `.env.example` in Railway dashboard
3. Railway auto-detects `Dockerfile`

## BetterStack Setup (manual)
1. Create a Source in BetterStack Logs → copy source token
2. Create an Uptime Monitor → point to Railway domain + `/`
3. Configure alert contacts (email/Slack)

## Sentry Setup (manual)
1. Create a Node.js project in Sentry → copy DSN
2. Add `SENTRY_DSN` to Railway env vars
