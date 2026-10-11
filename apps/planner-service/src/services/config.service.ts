// [IMPL-DEFERRED: INT-002] — ADSP Configuration Service pattern storage
// OPEN-004: ADSP Config Service provisioning in target tenant environments unconfirmed.
// This stub returns an empty pattern list on read and HTTP 503 on write.
//
// X-Integration-Stubbed: INT-002
// Implementation status: lookup-empty stub

import { ServiceUnavailableError } from '../types';

export interface BusinessPattern {
  patternId: string;
  tenantId: string;
  name: string;
  description: string;
  conceptTypes: string[];
  adspServices: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IConfigService {
  getPatterns(tenantId: string): Promise<BusinessPattern[]>;
  createPattern(pattern: Omit<BusinessPattern, 'patternId' | 'createdAt' | 'updatedAt'>): Promise<BusinessPattern>;
  updatePattern(patternId: string, tenantId: string, updates: Partial<BusinessPattern>): Promise<BusinessPattern>;
  deactivatePattern(patternId: string, tenantId: string): Promise<void>;
}

/**
 * ConfigService — stub for INT-002 (ADSP Configuration Service).
 *
 * [IMPL-DEFERRED: INT-002]
 * - getPatterns() returns empty array (no patterns available until INT-002 is enabled)
 * - createPattern(), updatePattern(), deactivatePattern() throw ServiceUnavailableError
 *
 * OPEN-004: ADSP Configuration Service provisioning in target tenant environments
 * must be confirmed before enabling live calls.
 *
 * ✓ ASVS:V1.6.1 — write operations fail-closed; read operations return safe empty default
 */
export class ConfigService implements IConfigService {
  // [IMPL-DEFERRED: INT-002] — returns empty list; no live Config Service call
  async getPatterns(_tenantId: string): Promise<BusinessPattern[]> {
    // ✓ ASVS:V1.6.1 — safe empty default; does not error on read
    return [];
  }

  // [IMPL-DEFERRED: INT-002] — fail-closed stub for write
  async createPattern(
    _pattern: Omit<BusinessPattern, 'patternId' | 'createdAt' | 'updatedAt'>,
  ): Promise<never> {
    throw new ServiceUnavailableError(
      'Business pattern management is unavailable. ' +
        'Integration INT-002 (ADSP Configuration Service) is pending environment provisioning ' +
        '(OPEN-004). Pattern creation will be available once the Config Service is enabled.',
    );
  }

  // [IMPL-DEFERRED: INT-002] — fail-closed stub for write
  async updatePattern(
    _patternId: string,
    _tenantId: string,
    _updates: Partial<BusinessPattern>,
  ): Promise<never> {
    throw new ServiceUnavailableError(
      'Business pattern management is unavailable. ' +
        'Integration INT-002 (ADSP Configuration Service) is pending environment provisioning ' +
        '(OPEN-004).',
    );
  }

  // [IMPL-DEFERRED: INT-002] — fail-closed stub for write
  async deactivatePattern(_patternId: string, _tenantId: string): Promise<never> {
    throw new ServiceUnavailableError(
      'Business pattern management is unavailable. ' +
        'Integration INT-002 (ADSP Configuration Service) is pending environment provisioning ' +
        '(OPEN-004).',
    );
  }
}
