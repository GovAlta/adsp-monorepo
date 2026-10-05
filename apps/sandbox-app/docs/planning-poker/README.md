# Planning poker (sandbox POC)

A planning poker board in the sandbox app, built without a backend. Team members use it with their own
Keycloak login; there are no poker-specific roles. Anyone in a session can start a round for a story,
everyone picks a card, and the votes stay hidden until someone reveals them.

For now it is used by tenant admins only. See [Known limitations](#known-limitations) for what plain
tenant users need.

UI: `apps/sandbox-app/src/app/components/services/planning-poker/`. State: `apps/sandbox-app/src/app/state/poker.slice.ts`.

## How it works

```
Sandbox app ──POST /script/v1/scripts/poker-*──► script service (Lua, runs as the script service account)
     ▲                                              │
     │ socket.io: stream planning-poker-updates     ├─► value service: rounds, participants, votes
     │ filtered by context.sessionId                └─► event service: planning-poker:* events
     └──────────────────── push service ◄──────────────┘
```

- Players run scripts, not service APIs. The scripts use the script service account, so players never
  need `value-reader` and cannot read anyone's vote before the reveal.
- `vote-cast` events say who voted but not the card. `votes-revealed` carries every vote.
- On every socket (re)connect the board runs `poker-get-state`, so missed events are recovered.
- Participants are identified by email (`userId`), falling back to the Keycloak user ID if a token has
  no email.
- Anyone can set a nickname (shown as `userName`) when joining or on the board. It is saved in the
  browser and re-sent with `poker-join`, so others see the change straight away.

| Script              | Does                                                                |
| ------------------- | ------------------------------------------------------------------- |
| `poker-start-round` | Saves the round, sends `round-started`                              |
| `poker-join`        | Saves the participant, sends `participant-joined`                   |
| `poker-cast-vote`   | Saves the vote, sends `vote-cast` (no card)                         |
| `poker-get-state`   | Returns the session; cards only after reveal                        |
| `poker-reveal`      | Closes the round, sends `votes-revealed` with average and consensus |

The script service and push service both require a role, so the scripts' runner roles and the
stream's subscriber roles are set to `default-roles-<realm>`. Keycloak gives that role to every user
in the realm, which makes "is a user of the tenant" the only requirement.

Values are written to namespace `planning-poker`: `round-<sessionId>` (newest entry is the current
round), `participants-<sessionId>`, and `votes-<roundId>` (newest entry per user is their vote).

## Setup

1. **Check the script service account.** It needs the `value-writer` and `value-reader` client roles
   of `urn:ads:platform:value-service` in the core realm. If `poker-start-round` fails with a 403 from
   the value service, ask a platform admin to grant them.
2. **Give team members an account in the `autotest` realm.** The sandbox only signs in to the
   `autotest` tenant. No roles need to be assigned.
3. **Configure the tenant.** This adds the event definitions, the push stream, and the 5 scripts:

   ```bash
   # Dry run: prints the configuration patches (set TENANT_REALM to see the real role name)
   node apps/sandbox-app/docs/planning-poker/configure-tenant.mjs

   # Apply with a tenant admin access token for autotest; the realm is read from the token
   CONFIGURATION_SERVICE_URL=https://configuration-service.adsp-uat.alberta.ca \
   ADSP_TOKEN=<access token> \
   node apps/sandbox-app/docs/planning-poker/configure-tenant.mjs --apply
   ```

   To set it up by hand in tenant admin instead: create each script from `scripts/*.lua` with runner
   role `default-roles-<realm>`, **Use service account** on, and **Include values in event** off. Then
   add a push stream `planning-poker-updates` with the 4 `planning-poker` events and
   `default-roles-<realm>` as the subscriber role.

4. **Try it.** Open the sandbox, go to **Planning poker**, select **Start new session**, and share the
   link.

## Known limitations

- **Plain tenant users get signed out.** The script and push services only accept tokens whose `aud`
  includes `urn:ads:platform:script-service` and `urn:ads:platform:push-service`. Keycloak adds those
  only for users holding a role of those clients, which tenant admins do. For anyone else the calls
  fail with 401, and the sandbox signs the user out on any 401. To open it up, add **Audience** mappers
  for both services to the `urn:ads:platform:sandbox-app` client in the realm.
- **Anyone in a session can start rounds and reveal.** There is no facilitator role.
- **Voter identity comes from the browser.** Lua scripts only receive `inputs`, not the caller, so a
  player could send someone else's `userId`. Fixing this needs the script service to pass the caller's
  identity into the Lua environment.
- **Tenant admins can read votes early.** Anyone with `value-reader` (part of tenant admin) can read
  the `votes-<roundId>` values through the value service API.
- **No cleanup.** Value series are kept, which also gives an estimate history per session.
- Script inputs must be strings. A vote sent as a JSON number is converted to its card text.
