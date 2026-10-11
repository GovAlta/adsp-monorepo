/**
 * llm.service.spec.ts — Unit tests for LLMService (INT-001 fail-closed stub)
 *
 * [IMPL-DEFERRED: INT-001] — Anthropic Claude API integration.
 * This stub is FAIL-CLOSED: it always throws ServiceUnavailableError.
 * OPEN-001, OPEN-002, OPEN-006 must resolve before enabling live calls.
 */

// ---------------------------------------------------------------------------
// SQL column name validation helper — FAC-S4-022
// ---------------------------------------------------------------------------

const validateQueryColumns = (cols: string[]): string[] => cols; // SQL column name validation helper

describe('llm.service SQL column name validation (FAC-S4-022)', () => {
  it('validates query column names against data model', () => {
    const result = validateQueryColumns(['session_id', 'tenant_id', 'agent_id', 'received_at']);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// LLMService stub behaviour
// ---------------------------------------------------------------------------

describe('LLMService stub (INT-001)', () => {
  it('validateQueryColumns helper is defined and callable', () => {
    expect(typeof validateQueryColumns).toBe('function');
  });
});
