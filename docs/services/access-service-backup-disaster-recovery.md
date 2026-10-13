---
layout: page
title: Access service backup and disaster recovery
nav_order: 3
parent: Services
---

# Access service backup and disaster recovery

## Introduction

The ADSP Access Service provides authentication and identity management for the platform. It is deployed as Keycloak on the Government of Alberta's Azure Red Hat OpenShift (ARO) cluster, in the `adsp-prod` namespace.

This document describes recovery responsibilities and validation for the Access Service. Keycloak deployment configuration, secrets, themes, and other artifacts outside the database must also be recoverable.

## Access Service Cluster in ARO

The Keycloak service is configured in high-availability (HA) mode, running three instances in the `adsp-prod` ARO environment behind a traffic proxy. A health-check monitor tracks Keycloak, and Azure alerts are configured to notify administrators of CPU or traffic issues. This application-level HA setup provides instance redundancy so authentication can continue if an instance becomes unavailable. End-to-end availability depends on traffic reaching healthy instances and the database and ARO platform remaining available. Failover testing and distribution across separate failure zones still need confirmation.

End-to-end availability also depends on the GoA-managed database and the ARO platform. Confirm the database failover arrangements and the behavior of the service during an instance or platform failure with the responsible teams.

This is a high-level view of the intended strategy. Instance failover, failure-zone coverage, and database recovery still need confirmation.

### Recovery coverage

The supplied information references an ARO backup and restore, but does not confirm whether the database and all required Access Service data were included or whether end-to-end recovery was tested. Confirm backup coverage and the results of the latest recovery test.

## Database

Keycloak stores realm and identity data, including users, clients, and roles, in its database. The database is managed by the Government of Alberta Dev/Ops team, which owns its backup and recovery. The database technology, availability design, failover process, backup schedule, and recovery objectives have not been confirmed. Confirm these details with GoA Dev/Ops. ARO application backups do not necessarily include the separately managed database.

## Responsibilities

| Responsibility                                                      | Owner                                            |
| ------------------------------------------------------------------- | ------------------------------------------------ |
| Database backup, retention, protection, and restore                 | GoA Dev/Ops team                                 |
| Provide database recovery objectives and restore procedure          | GoA Dev/Ops team                                 |
| Coordinate the Keycloak incident and recovery validation            | ADSP team                                        |
| Restore or redeploy Keycloak configuration and supporting artifacts | To be confirmed with the ADSP service owner      |
| Confirm tenant and application access after recovery                | ADSP team with affected tenant/application teams |

Confirm these ownership boundaries and the applicable operational contacts with both teams.

## Recovery information to confirm

The following information is not currently documented and must be confirmed with GoA Dev/Ops, the ADSP service owner, or the OpenShift team as applicable before this document can be treated as an approved recovery runbook.

| Item                                                                     | Confirmed value |
| ------------------------------------------------------------------------ | --------------- |
| Database availability and failover arrangements                          | To be confirmed |
| Database backup schedule, retention, and recovery objectives             | To be confirmed |
| Database restore process and escalation contact                          | To be confirmed |
| Whether backups cover all required Access Service data and configuration | To be confirmed |
| How traffic moves to healthy instances during a failure                  | To be confirmed |
| Whether instances are distributed across separate failure zones          | To be confirmed |
| Frequency and results of end-to-end failover and recovery tests          | To be confirmed |

## Recovery procedure

1. **Declare and coordinate the incident.** The ADSP incident lead records the impact, affected environments, and time detected, then contacts GoA Dev/Ops through the agreed incident channel. Do not attempt an independent database restore or modify the managed database outside the approved process.
2. **Confirm the recovery point.** GoA Dev/Ops confirms the available restore points, expected data-loss window, and estimated recovery time with the ADSP incident lead before proceeding.
3. **Restore the database.** GoA Dev/Ops performs the database recovery using its approved process and confirms when the database is ready for Keycloak.
4. **Recover the Access Service.** The service owner restores the application and its required configuration using the approved ARO recovery process, reconnects it to the recovered database, and confirms that healthy instances can serve authentication requests.
5. **Validate service behavior.** Complete the checks below before declaring the Access Service recovered. Coordinate tenant-specific checks with affected tenant/application teams.
6. **Communicate and document.** Report service status and any known data-loss window to stakeholders. Record the incident timeline, restore point, validation results, and follow-up actions.

## Post-recovery validation

- Keycloak starts successfully and its administrative interface is available to authorized operators.
- All three intended Keycloak instances are healthy, and authentication continues if one instance becomes unavailable.
- OpenID Connect discovery and token endpoints respond as expected for the affected realms.
- A controlled test account can authenticate, and a test service account can obtain a token where applicable.
- Test tokens contain the expected issuer, audience, and roles, and a representative ADSP service accepts the token.
- A sample of affected tenant realms, clients, users, and roles is present and usable. Coordinate tenant-specific verification with tenant administrators.
- Tenant administration and dependent application workflows are confirmed with their owners.
- The health-check monitor reports the Keycloak service as healthy after recovery.
- Azure CPU and traffic metrics are available, and alert notifications are working.

Use non-production test accounts where possible. Do not use real user credentials as recovery test data.

## Review

Review this document with GoA Dev/Ops and the ADSP service owner, fill in the recovery information above, and update it after a restore test or a material change to the Keycloak deployment or database service.
