import { errors } from '@strapi/utils';
import type { Modules } from '@strapi/types';
/**
 * /webhooks - GET all webhooks
 */
export declare namespace GetWebhooks {
    interface Request {
        body: {};
        query: {};
    }
    interface Response {
        data: Modules.WebhookStore.Webhook[];
        error?: errors.ApplicationError;
    }
}
/**
 * GET /webhooks/:id - Get a webhook
 */
export declare namespace GetWebhook {
    interface Request {
        body: {};
        query: {};
    }
    interface Params {
        id: Modules.WebhookStore.Webhook['id'];
    }
    interface Response {
        data: Modules.WebhookStore.Webhook;
        error?: errors.ApplicationError;
    }
}
/**
 * POST /webhooks - Create a webhook
 */
export declare namespace CreateWebhook {
    interface Request {
        body: Modules.WebhookStore.Webhook;
        query: {};
    }
    interface Response {
        data: Modules.WebhookStore.Webhook;
        error?: errors.ApplicationError | errors.YupValidationError;
    }
}
/**
 * PUT /webhooks/:id - Update a webhook
 */
export declare namespace UpdateWebhook {
    interface Request {
        body: Partial<Modules.WebhookStore.Webhook>;
        query: {};
    }
    interface Params {
        id: Modules.WebhookStore.Webhook['id'];
    }
    interface Response {
        data: Modules.WebhookStore.Webhook;
        error?: errors.ApplicationError | errors.YupValidationError;
    }
}
/**
 * DELETE /webhooks/:id - Delete a webhook
 */
export declare namespace DeleteWebhook {
    interface Request {
        body: {};
        query: {};
    }
    interface Params {
        id: Modules.WebhookStore.Webhook['id'];
    }
    interface Response {
        data: Modules.WebhookStore.Webhook;
        error?: errors.ApplicationError;
    }
}
/**
 * POST /webhooks/batch-delete' - Delete multiple webhooks
 */
export declare namespace DeleteWebhooks {
    interface Request {
        body: {
            ids: Modules.WebhookStore.Webhook['id'][];
        };
        query: {};
    }
    interface Response {
        data: {};
        error?: errors.ApplicationError;
    }
}
/**
 * POST /webhooks/:id/trigger - Trigger a webhook
 */
export declare namespace TriggerWebhook {
    interface Request {
        body: {};
        query: {};
    }
    interface Params {
        id: Modules.WebhookStore.Webhook['id'];
    }
    interface Response {
        data: {
            statusCode: number;
            message?: string;
        };
        error?: errors.ApplicationError;
    }
}
