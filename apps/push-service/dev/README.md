# Reliable event delivery PoC harness (CS-5398)

Local harness for the reliable front-end event delivery proof of concept. It runs the **real** push-service stream router,
Redis Streams replay buffer, buffer writer and tailer against local RabbitMQ and Redis. The platform services (Keycloak,
tenant, configuration, directory) are replaced by a stub: one tenant (`demo`), one public stream (`demo-updates`,
events `demo-service:item-updated` and `demo-service:item-deleted`), and anonymous access.

The demo page uses `@abgov/adsp-event-client/react` (`AdspEventProvider`, `useAdspEvent`, `useAdspEventStatus`).

## Run

```bash
# RabbitMQ (any local broker with guest/guest works)
docker run -d --name cs5398-rabbit -p 5672:5672 -p 15672:15672 rabbitmq:3-management

# Redis 7 on 6380 (so it doesn't collide with another local Redis on 6379)
docker run -d --name cs5398-redis -p 6380:6379 redis:7-alpine redis-server --appendonly yes

# Harness (from the repo root); open http://localhost:3390
npx tsx --tsconfig tsconfig.base.json apps/push-service/dev/harness.ts
```

Env overrides: `PORT` (3390), `REDIS_URL` (redis://localhost:6380), `AMQP_HOST`/`AMQP_USER`/`AMQP_PASSWORD`,
`PUSH_BUFFER_QUEUE` (push-service-buffer-dev), `PUSH_BUFFER_RETENTION_MINUTES` (60), `LOG_LEVEL`.

## Things to try

Every handled `item-updated` event carries a global `seq`. The handler log flags a **gap** if a seq is skipped and a
**dup** if one is delivered again, so you can see at a glance whether anything was lost.

| Scenario | How | Expected |
| --- | --- | --- |
| Live delivery | Publish buttons | `ok` rows in seq order. "event not in stream" never shows (and isn't buffered). |
| Temporary disconnect | **Go offline**, publish, **Go online** | Missed events replayed in order, no gap. |
| Network drop | **Drop connection**, then publish right away | Status goes offline → live, no gap. |
| push-service restart | Stop the harness, run `npx tsx --tsconfig tsconfig.base.json apps/push-service/dev/publish.ts 5`, start the harness | Events waited in the durable queue. The client reconnects and replays them, no gap. |
| Handler failure | Set **Fail next** to 2, publish | Two failed attempts, then `ok`. The cursor doesn't move while it retries. |
| Poison event | Set **Fail next** to 4 (more than the demo's 3 retries), publish 2 | `gave up … cursor advanced`, then the next event is handled. |
| Duplicate delivery | "item-updated with duplicate id" | Buffered and handled once. |
| Reload mid-handler | Set **Handler delay** to 4000, publish, reload within 4 s | After reload the same seq is handled again (at least once). The cursor is in sessionStorage, per tab. |
| Expired cursor | **Go offline**, publish, **Expire buffer**, **Go online** | `RESYNC` (`adsp:reset`, reason `cursor-expired`). |
| Redis data loss | **Wipe Redis**, then **Drop connection** | `RESYNC` (reason `epoch-changed`). |
| New tab | Open the page in another tab | Starts at "now". Each tab has its own cursor. |

Raw protocol:

```bash
curl -N "localhost:3390/stream/v1/streams/demo-updates?tenant=demo"                          # live, first frame adsp:ready
curl -N -H "Last-Event-ID: <cursor>" "localhost:3390/stream/v1/streams/demo-updates?tenant=demo"  # replay then live
curl "localhost:3390/stream/v1/streams/demo-updates/events?tenant=demo&after=<cursor>"         # polling / diagnostics
curl localhost:3390/dev/state
```

## Enabling in push-service itself

`PUSH_BUFFER_ENABLED=true` turns the buffer on in push-service (`src/main.ts`). It uses the existing `REDIS_*` settings,
plus `PUSH_BUFFER_QUEUE`, `PUSH_BUFFER_RETENTION_HOURS`, `PUSH_BUFFER_MAX_LENGTH` and `SSE_KEEPALIVE_SECONDS`. When it's
off, push-service behaves as before.
