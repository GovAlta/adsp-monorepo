// [IMPL-DEFERRED: INT-001] — Anthropic Claude API integration
// OPEN-001, OPEN-002, OPEN-006 must resolve before enabling live calls.
// This stub is FAIL-CLOSED: it always throws ServiceUnavailableError.
// NEVER make live Anthropic API calls from this file until INT-001 is approved.
//
// X-Integration-Stubbed: INT-001
// Implementation status: fail-closed stub

import { LLMRequest, LLMResponse, ServiceUnavailableError } from '../types';

export interface ILLMService {
  callLLM(request: LLMRequest): Promise<LLMResponse>;
}

/**
 * LLMService — FAIL-CLOSED stub for INT-001 (Anthropic Claude API).
 *
 * [IMPL-DEFERRED: INT-001]
 * This stub ALWAYS throws ServiceUnavailableError. It will never make a live
 * API call to Anthropic until the following open questions are resolved:
 *   - OPEN-001: GoA legal review of Protected B data transfer to US-based Anthropic PBC
 *   - OPEN-002: Data processing agreement with Anthropic PBC required
 *   - OPEN-006: GoA privacy officer sign-off on out-of-jurisdiction transfer
 *
 * The fail-closed design prevents accidental Protected B data exfiltration to
 * Anthropic before legal/privacy clearance.
 *
 * ✓ ASVS:V1.6.1 — external integration stubs fail-closed; no data leak on missing config
 * ✓ CAS:RULE-028 — Protected B conversation content must not leave jurisdiction without approval
 */
export class LLMService implements ILLMService {
  // ✓ ASVS:V1.6.1 — callLLM always fails until INT-001 is approved and live
  async callLLM(_request: LLMRequest): Promise<never> {
    // [IMPL-DEFERRED: INT-001] — fail-closed stub; never transmit to Anthropic API here
    throw new ServiceUnavailableError(
      'AI planning assistance is currently unavailable. ' +
        'Integration INT-001 (Anthropic Claude API) is pending governance approval ' +
        '(OPEN-001: legal review, OPEN-002: data processing agreement, OPEN-006: privacy sign-off). ' +
        'Please try again after the service has been enabled by your administrator.',
    );
  }
}
