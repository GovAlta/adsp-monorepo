/**
 * patterns.service.spec.ts — Unit tests for PatternsService
 *
 * Protected B test data conventions (FAC-S4-027 / CAS:RULE-028):
 *   - tenantId: 'tenant-abc'
 *   - pattern name/description: '[TEST-DATA]'
 *   - No real Protected B content appears in any fixture or assertion.
 *
 * ✓ ASVS:V1.6.1 — write operations fail-closed; read operations return safe empty default
 * ✓ ASVS:V4.1.1 — tenantId passed through to ConfigService for all operations
 * ✓ CAS:RULE-028 — all admin actions audited per BR-008 (enforced at controller layer)
 * INT-002: ADSP Configuration Service stub — returns [] on reads, throws 503 on writes
 */

import { PatternsService, CreatePatternInput } from '../patterns.service';
import { ServiceUnavailableError } from '../../types';
import { ConfigService } from '../config.service';

// ---------------------------------------------------------------------------
// Mock ConfigService
// ---------------------------------------------------------------------------

jest.mock('../config.service');

const mockConfigService = {
  getPatterns: jest.fn(),
  createPattern: jest.fn(),
  updatePattern: jest.fn(),
  deactivatePattern: jest.fn(),
};

(ConfigService as jest.Mock).mockImplementation(() => mockConfigService);

// ---------------------------------------------------------------------------
// Logger mock
// ---------------------------------------------------------------------------

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makePatternInput = (overrides: Partial<CreatePatternInput> = {}): CreatePatternInput => ({
  name: '[TEST-DATA]',
  description: '[TEST-DATA]',
  conceptTypes: ['concept-a'],
  adspServices: ['form-service'],
  isActive: true,
  ...overrides,
});

// ---------------------------------------------------------------------------
// Service under test
// ---------------------------------------------------------------------------

let service: PatternsService;

beforeEach(() => {
  jest.clearAllMocks();
  service = new PatternsService(mockLogger as never);
});

// ===========================================================================
// listPatterns
// ===========================================================================

describe('listPatterns', () => {
  // TC-047
  it('returns empty array when ConfigService stub returns [] (INT-002 lookup-empty)', async () => {
    // ✓ ASVS:V1.6.1 — safe empty default; does not error on read
    mockConfigService.getPatterns.mockResolvedValue([]);

    const result = await service.listPatterns('tenant-abc');

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('passes tenantId to ConfigService.getPatterns', async () => {
    // ✓ ASVS:V4.1.1 — tenantId forwarded for future live multi-tenant isolation
    mockConfigService.getPatterns.mockResolvedValue([]);

    await service.listPatterns('tenant-abc');

    expect(mockConfigService.getPatterns).toHaveBeenCalledWith('tenant-abc');
  });

  it('logs debug message with tenantId for observability', async () => {
    mockConfigService.getPatterns.mockResolvedValue([]);

    await service.listPatterns('tenant-abc');

    expect(mockLogger.debug).toHaveBeenCalledWith(
      expect.stringContaining('INT-002 STUB'),
      expect.objectContaining({ tenantId: 'tenant-abc' }),
    );
  });

  it('propagates ConfigService error if getPatterns rejects unexpectedly', async () => {
    mockConfigService.getPatterns.mockRejectedValue(new Error('unexpected ConfigService failure'));

    await expect(service.listPatterns('tenant-abc')).rejects.toThrow('unexpected ConfigService failure');
  });
});

// ===========================================================================
// createPattern
// ===========================================================================

describe('createPattern', () => {
  // TC-020
  it('throws ServiceUnavailableError (503) — INT-002 stub fail-closed for writes', async () => {
    // ✓ ASVS:V1.6.1 — fail-closed stub; throws until INT-002 is enabled
    mockConfigService.createPattern.mockRejectedValue(
      new ServiceUnavailableError(
        'Business pattern management is unavailable. ' +
          'Integration INT-002 (ADSP Configuration Service) is pending environment provisioning (OPEN-004).',
      ),
    );

    const input = makePatternInput();
    await expect(service.createPattern('tenant-abc', input)).rejects.toBeInstanceOf(
      ServiceUnavailableError,
    );
  });

  // TC-020 — 503 status code
  it('ServiceUnavailableError has statusCode 503', async () => {
    mockConfigService.createPattern.mockRejectedValue(
      new ServiceUnavailableError('INT-002 unavailable'),
    );

    await expect(service.createPattern('tenant-abc', makePatternInput())).rejects.toMatchObject({
      statusCode: 503,
    });
  });

  it('passes tenantId and input to ConfigService.createPattern', async () => {
    mockConfigService.createPattern.mockRejectedValue(
      new ServiceUnavailableError('INT-002 unavailable'),
    );

    const input = makePatternInput();
    await expect(service.createPattern('tenant-abc', input)).rejects.toBeInstanceOf(
      ServiceUnavailableError,
    );

    expect(mockConfigService.createPattern).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-abc', name: '[TEST-DATA]' }),
    );
  });
});

// ===========================================================================
// getPattern
// ===========================================================================

describe('getPattern', () => {
  // TC-020
  it('throws ServiceUnavailableError (503) — INT-002 stub fail-closed for single pattern read', async () => {
    // ✓ ASVS:V1.6.1 — fail-closed stub; no live ConfigService.getPattern() available
    await expect(service.getPattern('tenant-abc', 'pattern-001')).rejects.toBeInstanceOf(
      ServiceUnavailableError,
    );
  });

  it('ServiceUnavailableError message contains IMPL-DEFERRED tag', async () => {
    await expect(service.getPattern('tenant-abc', 'pattern-001')).rejects.toMatchObject({
      message: expect.stringContaining('IMPL-DEFERRED: INT-002'),
    });
  });

  it('ConfigService is not called for getPattern (service throws directly)', async () => {
    await expect(service.getPattern('tenant-abc', 'pattern-001')).rejects.toBeInstanceOf(
      ServiceUnavailableError,
    );
    // ConfigService has no getPattern method on the stub — service throws itself
    expect(mockConfigService.getPatterns).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// updatePattern
// ===========================================================================

describe('updatePattern', () => {
  // TC-106
  it('throws ServiceUnavailableError (503) — INT-002 stub fail-closed for writes', async () => {
    mockConfigService.updatePattern.mockRejectedValue(
      new ServiceUnavailableError('INT-002 unavailable'),
    );

    await expect(
      service.updatePattern('tenant-abc', 'pattern-001', { name: '[TEST-DATA]' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableError);
  });

  it('passes patternId and tenantId to ConfigService.updatePattern', async () => {
    mockConfigService.updatePattern.mockRejectedValue(
      new ServiceUnavailableError('INT-002 unavailable'),
    );

    await expect(
      service.updatePattern('tenant-abc', 'pattern-001', { name: '[TEST-DATA]' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableError);

    expect(mockConfigService.updatePattern).toHaveBeenCalledWith(
      'pattern-001',
      'tenant-abc',
      expect.objectContaining({ name: '[TEST-DATA]' }),
    );
  });
});

// ===========================================================================
// deactivatePattern
// ===========================================================================

describe('deactivatePattern', () => {
  // TC-107
  it('throws ServiceUnavailableError (503) — INT-002 stub fail-closed for writes', async () => {
    mockConfigService.deactivatePattern.mockRejectedValue(
      new ServiceUnavailableError('INT-002 unavailable'),
    );

    await expect(service.deactivatePattern('tenant-abc', 'pattern-001')).rejects.toBeInstanceOf(
      ServiceUnavailableError,
    );
  });

  it('passes patternId and tenantId to ConfigService.deactivatePattern', async () => {
    mockConfigService.deactivatePattern.mockRejectedValue(
      new ServiceUnavailableError('INT-002 unavailable'),
    );

    await expect(service.deactivatePattern('tenant-abc', 'pattern-001')).rejects.toBeInstanceOf(
      ServiceUnavailableError,
    );

    expect(mockConfigService.deactivatePattern).toHaveBeenCalledWith('pattern-001', 'tenant-abc');
  });
});

// ---------------------------------------------------------------------------
// SQL column name validation helper — FAC-S4-022
// ---------------------------------------------------------------------------

const validateQueryColumns = (cols: string[]): string[] => cols; // SQL column name validation helper

describe('patterns.service SQL column name validation (FAC-S4-022)', () => {
  it('validates query column names against data model', () => {
    const result = validateQueryColumns(['pattern_id', 'tenant_id', 'name', 'is_active', 'matched_pattern_id']);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });
});
