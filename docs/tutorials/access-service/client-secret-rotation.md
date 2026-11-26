---
title: Client Secret Rotation
layout: page
nav_order: 7
parent: Access Service
grand_parent: Tutorials
---

# Client secret rotation in Access service

This guide is for application owners and tenant admins who rotate the secret of a confidential client in Access service. Most tasks can be done two ways: **Option 1** in the ADSP portal (**Access > Client secrets**), or **Option 2** in the Keycloak admin console. It covers enabling rotation in a realm, choosing which clients it covers, rotating a secret, handling a leaked secret, and responding to the rotation notifications.

{: .warning }
The ADSP portal option depends on the client secret rotation service, which is not yet available in production. Use the Keycloak option until it is.

| Task | ADSP portal | Keycloak admin console |
|:-|:-|:-|
| Turn rotation on for the realm | Yes | Yes |
| Set periods | Secret expiration, rotated secret expiration, notice period | Secret expiration, rotated secret expiration, remain expiration time |
| Opt a client in | Yes | Yes (`rotation-enabled` role) |
| Client contacts and Send notification | Yes | No |
| Rotate a secret | Yes | Yes (Regenerate) |
| Invalidate the previous secret | Yes | Yes |
| View the new secret value | No | Yes (Credentials tab) |

The portal needs the `client-secret-admin` or `tenant-admin` role. It never shows secret values, so always read the new secret from the client's Credentials tab in Keycloak.

| If you need to... | Go to |
|:-|:-|
| Set up rotation for a realm, or a rotation is due | Scheduled rotation: [Enable the rotation policy](#enable-the-rotation-policy-in-a-realm) to [Rollback](#rollback) |
| Respond to a leaked secret | [Emergency rotation for a leaked secret](#emergency-rotation-for-a-leaked-secret) |
| Find out who owns what and how stale secrets are monitored | [Ownership and monitoring](#ownership-and-monitoring) |

{: .note }
Rotation is event-driven, not timed. Keycloak rotates a secret only when the client is updated (for example, **Regenerate**). It does not rotate on a timer, and it does not renew an expired secret. Notification emails come from the ADSP Notification service, not from Keycloak.

## Prerequisites

| You need | Why |
|:-|:-|
| Keycloak 25 or later with the `client-secret-rotation` preview feature enabled | The secret rotation executor does not exist without it. It is a server build option (`KC_FEATURES`) set by the platform team. Check **Master realm > Server info > Features**. |
| Realm admin with `manage-realm` and `manage-clients` | Client policies are realm settings. Roles, Credentials and Regenerate are client settings. |
| A confidential client (**Client authentication** On) | Only clients with a secret can rotate. |

{: .warning }
Never apply a rotation policy to the `master` realm. The `core` realm is managed by the platform team.

## How rotation works

```
 secret valid                 client updated (Regenerate)            old secret expires
 ------------------------------+--------------------------------------+---------------->
                               |                                      |
                      new secret issued; old one                 old secret stops
                      kept as the "rotated secret"               working (401)
                               +------ Rotated Secret expiration -----+
```

| State | What happens |
|:-|:-|
| Current | The secret in use. It has an expiry once the policy applies and the client has been rotated. |
| Rotated | The previous secret. It still works until its Rotated Secret expiration, so there is time to update applications. |
| Expired | The secret no longer works (401 `unauthorized_client`). Keycloak does not renew it. Regenerate to get a new one. |

Existing clients get an expiry only after their first Regenerate once the policy applies.

## Enable the rotation policy in a realm

Do this in the realm that holds the clients.

### Option 1: ADSP portal

1. Open **Access > Client secrets**.
2. Under **Automatic rotation**, select **On**, click **Save** and confirm. The first time, this creates the rotation policy and profile in the realm.
3. In **Rotation schedule**, set **Secret expiration**, **Rotated secret expiration** and **Notice period** in seconds (see [Choose the periods](#choose-the-periods)) and save. The rotated secret expiration must be smaller than the secret expiration, and the notice period shorter than the secret lifetime.

To turn rotation off, select **Off** and save.

### Option 2: Keycloak admin console

A profile holds the rotation rules, and a policy decides which clients get the profile.

#### Create the profile with the executor

1. Select the realm, then **Realm settings > Client policies > Profiles**.
2. Click **Create client profile**, name it (for example `secret-rotation`) and save.
3. In the profile, under Executors, click **Add executor** and choose `secret-rotation`.
4. Set the periods (see [Choose the periods](#choose-the-periods)) and click **Add**.

#### Create the policy that applies it

1. Go to **Realm settings > Client policies > Policies** and click **Create client policy**. Name it (for example `secret-rotation-policy`) and save.
2. Under Conditions, click **Add condition**, choose the condition type `client-access-type`, set the access type to `confidential` and save.
3. Click **Add condition** again, choose the condition type `client-roles`, set the role to `rotation-enabled` and save.
4. Under Client profiles, click **Add client profile** and select the profile you created.
5. Make sure the policy is **Enabled**, then save.

Both conditions must match, so the policy covers only confidential clients that also have the `rotation-enabled` role. To cover every client that has a secret, skip steps 2 and 3.

| Option | Covers |
|:-|:-|
| No condition | All clients with a secret in the realm |
| `client-access-type` = `confidential` | Confidential clients only |
| `client-roles` = `rotation-enabled` | Only clients that have that role (opt-in per client) |

On Keycloak 25.0.6 there is no condition that matches a client ID, and the `client-scopes` condition does not select clients. Use the `client-roles` condition to cover specific clients.

To turn rotation off for the realm, set the policy to Disabled or delete it. Existing secrets are not changed.

## Opt a client in

Do this for each client the policy should cover.

### Option 1: ADSP portal

1. Open **Access > Client secrets** and expand the client.
2. Tick **Automatic rotation**. It is disabled while realm rotation is Off.
3. Under contacts, click **Add contact** and enter the emails to notify. Realm admins are always notified as well.

Unticking **Automatic rotation** stops rotating the client and removes its expiry date.

### Option 2: Keycloak admin console

1. Go to **Clients** and open the client. Confirm **Client authentication** is On.
2. Open the **Roles** tab, click **Create role** and enter `rotation-enabled` exactly.
3. Open the **Credentials** tab and click **Regenerate** so the client gets its first expiry. Update the application as described in [Update the application](#update-the-application-with-the-new-secret).

To stop rotating a client, delete its `rotation-enabled` role. Its current secret keeps its expiry.

## Choose the periods

The portal's **Secret expiration** and **Rotated secret expiration** map to the executor fields below. **Notice period** is portal only and sets how long before expiry the due notification is sent. **Remain Expiration Time** is Keycloak only.

| Executor field | Meaning | Suggested start |
|:-|:-|:-|
| Secret expiration | How long a secret is valid from when it is issued. | 90 days |
| Rotated Secret expiration | How long the previous secret keeps working after a rotation. | 7 days |
| Remain Expiration Time | How long before expiry a client update rotates the secret. Earlier updates keep the current secret. | 30 days |

{: .warning }
Rotated Secret expiration and Remain Expiration Time must each be smaller than Secret expiration. Otherwise Keycloak rejects the profile with "proposed client profile contains the executor... invalid configuration".

## Rotate a secret manually

### Option 1: ADSP portal

1. Open **Access > Client secrets** and expand the client. Check the current and previous secret expiry.
2. Click **Rotate secret** and confirm. The client must be opted in and realm rotation On.
3. Open the client's **Credentials** tab in Keycloak and copy the new secret. The portal never shows it.
4. Update the application ([below](#update-the-application-with-the-new-secret)).

### Option 2: Keycloak admin console

1. Go to **Clients > your client > Credentials**.
2. Note the current secret expiry, and the rotated secret if there is one.
3. Click **Regenerate** and confirm. The old secret becomes the rotated secret.
4. Copy the new secret. Do not paste it into chat, tickets or email.
5. Update the application and verify it before the rotated secret expires.

If the secret is still outside the Remain Expiration Time, a plain client update may keep the current secret. Regenerate always issues a new one. A regenerate is recorded as an admin event (`CLIENT` / `ACTION`) when admin events are enabled, and as a `service-account.credential-rotated` audit action (see [Access service](../../services/access-service.md#audit-actions)).

## Emergency rotation for a leaked secret

{: .warning }
Invalidating the rotated secret cannot be undone. Any application still using it fails until it is updated.

### Contacts

| Role | Who | When |
|:-|:-|:-|
| App team owner | The client's owner (see [Ownership and monitoring](#ownership-and-monitoring)) | Immediately. They must update the application. |
| Tenant admin | The tenant's admin | Immediately. They hold the realm. |
| ADSP platform team | ADSP support channel (add link) | The executor is missing, emails are not sent, or the leak affects more than one client or realm. |
| Security contact | Your organisation's security contact (add link) | Any confirmed leak. |

### Trigger an out-of-band rotation

1. **Contact.** Tell the contacts above right away.
2. **Contain.** Remove the secret from where it leaked (repository, log, chat).
3. **Rotate now.**
   - Option 1, ADSP portal: **Access > Client secrets**, expand the client, click **Rotate secret**. This needs the client opted in. If it is not, use Option 2.
   - Option 2, Keycloak: **Clients > your client > Credentials > Regenerate**. This works at any time, regardless of the schedule.
4. **Update the application.** Copy the new secret from Keycloak's Credentials tab, store it, deploy and verify.
5. **Invalidate the old secret.**
   - Option 1: in the portal, click **Invalidate previous secret** (enabled while a previous secret is valid) and confirm.
   - Option 2: on the Keycloak Credentials tab, click **Invalidate rotated secret** and confirm.

   The rotated secret stops working immediately.
6. **Verify the old secret is dead.** A token request with it must return 401.

For a confirmed leak, do not wait for the rotated-secret window to end.

### Compressed notification sequence

The normal `client-secret-rotation-due` step is skipped in an emergency.

| Step | Event | Action |
|:-|:-|:-|
| 1 | `client-secret-rotated` | Regenerate now. Tenant admins and client contacts are notified. |
| 2 | | The app team updates the application and verifies the new secret (200). |
| 3 | `client-secret-revoked` | Invalidate the rotated secret. The old secret stops working and the notification goes out. |
| 4 | | Verify the old secret returns 401 and start the incident record. |

### Document the incident

Record the following in your incident ticket:

| Item | Detail |
|:-|:-|
| What leaked | Where, when it was found, and who found it. |
| Scope | Client ID, realm and environment. |
| Timeline | Times of Regenerate, application update, verification and Invalidate. |
| Evidence | Events and Admin events (`CLIENT` / `ACTION`) reviewed for unexpected use of the old secret. |
| Communication | Who was told (app team, tenant admin, security) and when. |
| Follow-up | Actions to prevent a repeat. |

## Update the application with the new secret

1. **Store it in your secret store.** Never in source code, images, tickets or chat. Common places:

   | Pattern | Where to update |
   |:-|:-|
   | Environment variable | The deployment's environment (or CI/CD secret variable) that sets the client secret. |
   | Kubernetes or OpenShift secret | Edit the `Secret` that the deployment references. |
   | Azure Key Vault | Add a new version of the secret and point the app at it. |
   | Terraform | Update the variable or secret resource, and apply. Keep the value out of state files and repositories. |

2. **Restart or reload.** Environment variables and mounted secrets are read when the pod starts. Restart the deployment, or use a reloader.
3. **Use the rotated-secret window for zero downtime.** Both secrets work until the rotated secret expires. Deploy one instance at a time and keep the old secret for rollback until all are healthy.
4. **Update every consumer.** Check scripts, pipelines and other environments using the same client.

Nothing updates the secret store for you. Neither Keycloak nor the notifications push the new secret anywhere.

## Verify the client authenticates

```
curl -s -X POST "{access-url}/auth/realms/{realm}/protocol/openid-connect/token" \
  -d "grant_type=client_credentials" \
  -d "client_id={client-id}" \
  -d "client_secret={secret}"
```

| Result | Meaning |
|:-|:-|
| 200 with an `access_token` | The secret works. |
| 401 `unauthorized_client` | The secret has expired or been invalidated. |
| 401 `invalid_client` | The client ID or secret is wrong. |

The new secret must return 200. The old secret returns 200 until the rotated secret expires or is invalidated, then 401. Also check that the application can call a protected API.

## Notifications

The **Client secret rotation** notification type emails tenant admins and the client's contacts. Emails never contain the secret. Read the new secret from the client's Credentials tab in Keycloak.

| Event | When | What to do |
|:-|:-|:-|
| `client-secret-rotation-due` | Before the secret expires. | Find the application that uses the client, book a deploy slot and regenerate when ready. |
| `client-secret-rotated` | After the secret is rotated. | Get the new secret from Credentials, update and redeploy the application, then verify before the old secret stops. |
| `client-secret-revoked` | After the old secret is invalidated. | Confirm the application already uses the new secret. If not, update it immediately. If the revoke was unexpected, check who invalidated it and whether a leak response is in progress. |

To receive the emails, subscribe in the Notification service to the **Client secret rotation** type (the subscriber needs the `client-secret-admin` role), and keep each client's contact emails up to date. In the ADSP portal, set contacts on the client card and use **Send notification** to send the due notice on demand (needs the client opted in and at least one contact).

## Troubleshooting

| Problem | Check |
|:-|:-|
| `secret-rotation` executor is not in the list | The preview feature is off. Check **Server info > Features** and ask the platform team. |
| Profile will not save with "invalid configuration" | Rotated Secret expiration or Remain Expiration Time is not smaller than Secret expiration. |
| Client has no expiry | It is not covered by the policy, or it has not been regenerated since the policy applied. Check the policy is Enabled and the conditions match, then Regenerate. |
| Client not covered | It is public, or lacks the `rotation-enabled` role on that client (exact name). |
| Emails not received | Subscribe to the Client secret rotation type in the Notification service. Check client contacts and spam folders. |
| Secret expired and the application is failing | Keycloak does not renew it. Regenerate and update the application. |
| Old secret still works | It is within the Rotated Secret expiration and has not been invalidated. |

## Rollback

- **Within the rotated-secret window**, the old secret still works. If a deploy with the new secret fails, roll the application back to the old secret and retry.
- **After the window, or after Invalidate rotated secret**, there is no way back. Only the current secret exists. Regenerate to issue another.
- **Disabling the policy** stops future rotation rules but does not restore an earlier secret.

## Ownership and monitoring

| Area | Owner | Responsibility |
|:-|:-|:-|
| Rotating each client's secret | App team that owns the client | Regenerate, update the secret store, redeploy and verify. ADSP does not rotate or update secrets on their behalf. |
| Realm policy and executor | Tenant admin | Keep the policy enabled with sensible periods. |
| Keycloak feature and platform | ADSP platform team | Keep the preview feature enabled and support escalations. |
| Stale secrets | ADSP platform team | Monitor and notify (below). |

### Monitoring stale secrets

1. After a 6-month grace period for adopting this guideline, ADSP scans for clients whose secrets have not rotated.
2. ADSP notifies the owners of non-compliant tenants.
3. The app team rotates the client as described above and confirms to ADSP.

{: .note }
The 6-month period is a proposal from the CS-5843 discussion. The start date and scan tooling are not yet decided.
