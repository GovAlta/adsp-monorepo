/**
 * The event hub is Strapi's event control center.
 */
import type { Logger } from '@strapi/logger';
import type { Modules } from '@strapi/types';
import type { EventHub } from './event-hub';
import type { Fetch } from '../utils/fetch';
type Webhook = Modules.WebhookStore.Webhook;
interface ConstructorParameters {
    eventHub: EventHub;
    logger: Logger;
    configuration?: Record<string, unknown>;
    fetch: Fetch;
}
interface Event {
    event: string;
    info: Record<string, unknown>;
}
declare class WebhookRunner {
    private eventHub;
    private logger;
    private config;
    private webhooksMap;
    private listeners;
    private queue;
    private fetch;
    constructor({ eventHub, logger, configuration, fetch }: ConstructorParameters);
    deleteListener(event: string): void;
    createListener(event: string): void;
    executeListener({ event, info }: Event): Promise<void>;
    run(webhook: Webhook, event: string, info?: {}): Promise<{
        statusCode: number;
        message?: undefined;
    } | {
        statusCode: number;
        message: string;
    } | {
        statusCode: number;
        message: any;
    }>;
    add(webhook: Webhook): void;
    update(webhook: Webhook): void;
    remove(webhook: Webhook): void;
}
/**
 * Expose a factory function instead of the class
 */
export default function createWebhookRunner(opts: ConstructorParameters): WebhookRunner;
export type { WebhookRunner };
//# sourceMappingURL=webhook-runner.d.ts.map