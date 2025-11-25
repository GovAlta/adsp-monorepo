import { errors } from '@strapi/utils';

const { ValidationError } = errors;
const webhookModel = {
    uid: 'strapi::webhook',
    singularName: 'strapi_webhooks',
    tableName: 'strapi_webhooks',
    attributes: {
        id: {
            type: 'increments'
        },
        name: {
            type: 'string'
        },
        url: {
            type: 'text'
        },
        headers: {
            type: 'json'
        },
        events: {
            type: 'json'
        },
        enabled: {
            type: 'boolean'
        }
    }
};
const toDBObject = (data)=>{
    return {
        name: data.name,
        url: data.url,
        headers: data.headers,
        events: data.events,
        enabled: data.isEnabled
    };
};
const fromDBObject = (row)=>{
    return {
        id: typeof row.id === 'number' ? row.id.toString() : row.id,
        name: row.name,
        url: row.url,
        headers: row.headers,
        events: row.events,
        isEnabled: row.enabled
    };
};
const webhookEventValidator = async (allowedEvents, events)=>{
    const allowedValues = Array.from(allowedEvents.values());
    events.forEach((event)=>{
        if (allowedValues.includes(event)) {
            return;
        }
        throw new ValidationError(`Webhook event ${event} is not supported`);
    });
};
const createWebhookStore = ({ db })=>{
    return {
        allowedEvents: new Map([
            [
                'ENTRY_CREATE',
                'entry.create'
            ],
            [
                'ENTRY_UPDATE',
                'entry.update'
            ],
            [
                'ENTRY_DELETE',
                'entry.delete'
            ],
            [
                'ENTRY_PUBLISH',
                'entry.publish'
            ],
            [
                'ENTRY_UNPUBLISH',
                'entry.unpublish'
            ],
            [
                'ENTRY_DRAFT_DISCARD',
                'entry.draft-discard'
            ]
        ]),
        addAllowedEvent (key, value) {
            this.allowedEvents.set(key, value);
        },
        removeAllowedEvent (key) {
            this.allowedEvents.delete(key);
        },
        listAllowedEvents () {
            return Array.from(this.allowedEvents.keys());
        },
        getAllowedEvent (key) {
            return this.allowedEvents.get(key);
        },
        async findWebhooks () {
            const results = await db.query('strapi::webhook').findMany();
            return results.map(fromDBObject);
        },
        async findWebhook (id) {
            const result = await db.query('strapi::webhook').findOne({
                where: {
                    id
                }
            });
            return result ? fromDBObject(result) : null;
        },
        async createWebhook (data) {
            await webhookEventValidator(this.allowedEvents, data.events);
            return db.query('strapi::webhook').create({
                data: toDBObject({
                    ...data,
                    isEnabled: true
                })
            }).then(fromDBObject);
        },
        async updateWebhook (id, data) {
            await webhookEventValidator(this.allowedEvents, data.events);
            const webhook = await db.query('strapi::webhook').update({
                where: {
                    id
                },
                data: toDBObject(data)
            });
            return webhook ? fromDBObject(webhook) : null;
        },
        async deleteWebhook (id) {
            const webhook = await db.query('strapi::webhook').delete({
                where: {
                    id
                }
            });
            return webhook ? fromDBObject(webhook) : null;
        }
    };
};

export { createWebhookStore, webhookModel };
//# sourceMappingURL=webhook-store.mjs.map
