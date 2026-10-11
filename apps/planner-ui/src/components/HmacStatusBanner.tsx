/**
 * HmacStatusBanner.tsx — HMAC audit chain integrity status banner (shared component)
 *
 * Calls verifyAuditChain on mount and renders a GoACallout indicating whether the
 * HMAC chain is intact or broken. Used by the AuditLog page.
 *
 * Business Rules: BR-014 (immutable audit log), BR-015 (HMAC chain integrity), SYSREQ-020.
 * TC coverage: TC-045 (verified → success banner), TC-046 (broken → emergency banner with CTA).
 *
 * ✓ ASVS:V-10.4.1 — HMAC chain integrity status displayed prominently on audit log access
 * ✓ ASVS:V-9.1.1 — verifyAuditChain auth from Keycloak context in api.ts
 *
 * Security: No Protected B or Protected A personal data is rendered in this component.
 * FAC-S5-026: No data written to localStorage or sessionStorage.
 */

import React, { useEffect, useState } from 'react';
import {
  GoACallout,
  GoACircularProgress,
} from '@abgov/react-components';
import { api } from '../services/api';
import type { AuditChainVerification } from '../services/api.types';

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

export interface HmacStatusBannerProps {
  /** sessionId is accepted for interface compatibility but not used —
   *  audit chain verification is tenant-wide (no session scope). */
  sessionId?: string;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

const HmacStatusBanner: React.FC<HmacStatusBannerProps> = () => {
  const [status, setStatus] = useState<AuditChainVerification | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);

    api
      .verifyAuditChain()
      .then((result) => {
        if (!cancelled) {
          setStatus(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <GoACircularProgress
        variant="inline"
        message="Verifying audit chain integrity..."
      />
    );
  }

  // ── Verification service unavailable ──────────────────────────────────────

  if (loadError) {
    return (
      <GoACallout type="emergency" heading="Chain Verification Unavailable">
        Unable to verify audit chain integrity. Please refresh the page or{' '}
        <a
          href="https://adsp.alberta.ca/support"
          target="_blank"
          rel="noopener noreferrer"
        >
          contact ADSP Support
        </a>{' '}
        if the problem persists.
      </GoACallout>
    );
  }

  if (!status) return null;

  // ── TC-045: Chain verified — success banner ───────────────────────────────

  if (status.verified) {
    return (
      <GoACallout type="success" heading="Chain Verified">
        All audit records are intact and tamper-evident.{' '}
        {status.totalEvents} event{status.totalEvents !== 1 ? 's' : ''} verified as of{' '}
        {new Date(status.checkedAt).toLocaleString('en-CA', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
        . (BR-015 / SYSREQ-020)
      </GoACallout>
    );
  }

  // ── TC-046: Chain broken — emergency banner with ADSP Support CTA ─────────

  return (
    <GoACallout
      type="emergency"
      heading="Integrity Warning — Contact ADSP Support Immediately"
    >
      One or more audit records may have been tampered with.
      {status.brokenAtEventId ? (
        <> Chain integrity broken at event <code>{status.brokenAtEventId}</code>.</>
      ) : null}{' '}
      This issue cannot be resolved by end users.{' '}
      <a
        href="https://adsp.alberta.ca/support"
        target="_blank"
        rel="noopener noreferrer"
      >
        Contact ADSP Support immediately
      </a>
      .
    </GoACallout>
  );
};

export default HmacStatusBanner;
