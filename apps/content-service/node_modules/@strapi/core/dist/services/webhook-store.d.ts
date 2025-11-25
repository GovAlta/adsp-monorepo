/**
 * Webhook store is the implementation of webhook storage over the core_store
 */
import type { Model, Database } from '@strapi/database';
import type { Modules } from '@strapi/types';
declare const webhookModel: Model;
type Webhook = Modules.WebhookStore.Webhook;
export interface WebhookStore {
    allowedEvents: Map<string, string>;
    addAllowedEvent(key: string, value: string): void;
    removeAllowedEvent(key: string): void;
    listAllowedEvents(): string[];
    getAllowedEvent(key: string): string | undefined;
    findWebhooks(): Promise<Webhook[]>;
    findWebhook(id: string): Promise<Webhook | null>;
    createWebhook(data: Webhook): Promise<Webhook>;
    updateWebhook(id: string, data: Webhook): Promise<Webhook | null>;
    deleteWebhook(id: string): Promise<Webhook | null>;
}
declare const createWebhookStore: ({ db }: {
    db: Database;
}) => WebhookStore;
export { webhookModel, createWebhookStore };
//# sourceMappingURL=webhook-store.d.ts.map