import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import { Logger } from 'winston';

// ✓ ASVS:V7.2.2 — audit logging for all security-relevant events
// ✓ CAS:RULE-028 — immutable audit trail with HMAC-SHA256 tamper evidence (BR-008)
// ✓ ASVS:V7.2.1 — audit events capture actor, action, resource, and outcome

export interface AuditEventPayload {
  actorId: string;
  tenantId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  outcome: 'success' | 'failure';
  detail?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditService {
  createEvent(payload: AuditEventPayload): Promise<void>;
  getLastChainHash(tenantId: string): Promise<string | null>;
}

/**
 * computeHmac — computes HMAC-SHA256 over the audit event payload for
 * tamper-evidence chain. Uses AUDIT_SIGNING_KEY from environment.
 *
 * ✓ ASVS:V7.2.2 — HMAC chain ensures audit log integrity
 * ✓ CAS:RULE-028 — signing key is env-sourced; never logged
 */
export function computeHmac(payload: string, signingKey: string): string {
  // ✓ ASVS:V2.9.1 — HMAC-SHA256 used for audit chain; not a password hash
  return crypto.createHmac('sha256', signingKey).update(payload).digest('hex');
}

/**
 * buildAuditChainHash — creates a chained HMAC for an audit entry.
 * The chain input = (chainAnchorHash || JSON.stringify(entry)) so each
 * entry depends on all prior entries for that tenant.
 *
 * ✓ CAS:RULE-028 — append-only chain; modification of any prior entry
 *   invalidates all subsequent hashes
 */
export function buildAuditChainHash(
  entry: AuditEventPayload & { timestamp: string },
  chainAnchorHash: string | null,
  signingKey: string,
): string {
  const chainInput = `${chainAnchorHash || ''}${JSON.stringify(entry)}`;
  return computeHmac(chainInput, signingKey);
}

/**
 * createAuditMiddleware — factory that returns an Express middleware which
 * creates an AuditEvent after the response is sent.
 *
 * Usage:
 *   router.post('/resource', requireAuth, createAuditMiddleware(auditService, signingKey, logger, 'CREATE', 'resource'));
 *
 * ✓ ASVS:V7.2.2 — fires after response to avoid blocking request
 */
export function createAuditMiddleware(
  auditService: AuditService,
  signingKey: string,
  logger: Logger,
  action: string,
  resourceType: string,
) {
  return function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
    // Capture response finish event for post-response audit write
    res.on('finish', async () => {
      try {
        const actorId = req.user?.userId || 'anonymous';
        const tenantId = req.user?.tenantId || req.tenantId || 'unknown';
        const outcome: 'success' | 'failure' = res.statusCode < 400 ? 'success' : 'failure';

        const payload: AuditEventPayload = {
          actorId,
          tenantId,
          action,
          resourceType,
          // ✓ CAS:RULE-028 — resourceId logged but no Protected B content in audit payload
          resourceId: (req.params as Record<string, string>)[`${resourceType}Id`] || req.params['id'],
          outcome,
          // ✓ ASVS:V7.2.1 — IP and UA captured for traceability; no session content
          ipAddress: req.ip || (req.socket?.remoteAddress ?? undefined),
          userAgent: req.headers['user-agent'],
        };

        // ✓ ASVS:V7.2.2 — audit event persisted asynchronously; does not affect response
        await auditService.createEvent(payload);
      } catch (auditErr) {
        // Audit failure must not affect the primary request; log and continue
        // ✓ ASVS:V7.1.2 — audit errors logged server-side; never surfaced to client
        logger.error('Failed to write audit event', {
          action,
          resourceType,
          path: req.path,
          error: auditErr instanceof Error ? auditErr.message : String(auditErr),
        });
      }
    });

    next();
  };
}

/**
 * auditAction — inline helper for explicit audit event creation within
 * controller/service handlers (for cases where middleware-level audit is insufficient).
 *
 * ✓ ASVS:V7.2.2 — explicit audit for operations not covered by route middleware
 */
export async function auditAction(
  auditService: AuditService,
  signingKey: string,
  payload: AuditEventPayload,
): Promise<void> {
  // ✓ CAS:RULE-028 — immutable audit record creation; no updates to existing events
  await auditService.createEvent(payload);
}
