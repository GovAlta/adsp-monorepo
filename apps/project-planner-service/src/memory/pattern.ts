import { AdspId } from '@abgov/adsp-service-sdk';
import { BusinessPattern, PatternRepository } from '../planner';

const key = (tenantId: AdspId, id: string) => `${tenantId}|${id}`;

export class MemoryPatternRepository implements PatternRepository {
  private patterns = new Map<string, BusinessPattern>();

  async find(tenantId: AdspId): Promise<BusinessPattern[]> {
    return [...this.patterns.entries()]
      .filter(([k]) => k.startsWith(`${tenantId}|`))
      .map(([, pattern]) => pattern)
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  async save(tenantId: AdspId, pattern: BusinessPattern, _user: { id: string; name: string }): Promise<BusinessPattern> {
    this.patterns.set(key(tenantId, pattern.id), pattern);
    return pattern;
  }

  async delete(tenantId: AdspId, id: string): Promise<boolean> {
    return this.patterns.delete(key(tenantId, id));
  }
}
