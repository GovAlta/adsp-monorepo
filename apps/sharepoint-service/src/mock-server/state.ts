import { randomUUID } from 'crypto';
import { MockAppRegistration, MockList, MockSeed, MockSite } from './seed';

export interface MockItem {
  id: string;
  fields: Record<string, unknown>;
  createdDateTime: string;
  lastModifiedDateTime: string;
}

export type FaultKind = 'throttle' | 'unavailable';

export interface MockSnapshot {
  apps: MockAppRegistration[];
  sites: (Omit<MockSite, 'lists'> & { lists: (MockList & { items: MockItem[] })[] })[];
}

const TOKEN_LIFETIME_MS = 3600 * 1000;

export class MockState {
  private tokens = new Map<string, { clientId: string; expiresAt: number }>();
  private items = new Map<string, MockItem[]>();
  private nextItemId = 1;
  private fault: { kind: FaultKind; remaining: number } | null = null;

  constructor(private seed: MockSeed) {}

  reset(): void {
    this.tokens.clear();
    this.items.clear();
    this.nextItemId = 1;
    this.fault = null;
  }

  findApp(tenantId: string, clientId: string): MockAppRegistration | undefined {
    return this.seed.apps.find((app) => app.tenantId === tenantId && app.clientId === clientId);
  }

  issueToken(clientId: string): string {
    const token = `mock.${randomUUID()}`;
    this.tokens.set(token, { clientId, expiresAt: Date.now() + TOKEN_LIFETIME_MS });
    return token;
  }

  clientForToken(token: string): string | null {
    const entry = this.tokens.get(token);
    return entry && entry.expiresAt > Date.now() ? entry.clientId : null;
  }

  findSite(siteId: string): MockSite | undefined {
    return this.seed.sites.find((site) => site.siteId === siteId);
  }

  listItems(listId: string): MockItem[] {
    return this.items.get(listId) ?? [];
  }

  createItem(listId: string, fields: Record<string, unknown>): MockItem {
    const now = new Date().toISOString();
    const item: MockItem = {
      id: String(this.nextItemId++),
      fields: { ...fields },
      createdDateTime: now,
      lastModifiedDateTime: now,
    };
    this.items.set(listId, [...this.listItems(listId), item]);
    return item;
  }

  updateItem(listId: string, itemId: string, fields: Record<string, unknown>): MockItem | null {
    const item = this.listItems(listId).find((candidate) => candidate.id === itemId);
    if (!item) {
      return null;
    }
    item.fields = { ...item.fields, ...fields };
    item.lastModifiedDateTime = new Date().toISOString();
    return item;
  }

  setFault(kind: FaultKind, count: number): void {
    this.fault = { kind, remaining: count };
  }

  takeFault(): FaultKind | null {
    if (!this.fault || this.fault.remaining <= 0) {
      return null;
    }
    this.fault.remaining -= 1;
    return this.fault.kind;
  }

  snapshot(): MockSnapshot {
    return {
      apps: this.seed.apps,
      sites: this.seed.sites.map((site) => ({
        ...site,
        lists: site.lists.map((list) => ({ ...list, items: this.listItems(list.listId) })),
      })),
    };
  }
}
