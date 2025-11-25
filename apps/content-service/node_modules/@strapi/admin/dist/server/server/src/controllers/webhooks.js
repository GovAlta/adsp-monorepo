'use strict';

var isLocalhostIp = require('is-localhost-ip');
var punycode = require('punycode/');
var _ = require('lodash');
var utils = require('@strapi/utils');

const urlRegex = /^(?:([a-z0-9+.-]+):\/\/)(?:\S+(?::\S*)?@)?(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9_]-*)*[a-z\u00a1-\uffff0-9_]+)(?:\.(?:[a-z\u00a1-\uffff0-9_]-*)*[a-z\u00a1-\uffff0-9_]+)*\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/;
const webhookValidator = utils.yup.object({
    name: utils.yup.string().required(),
    url: utils.yup.string().matches(urlRegex, 'url must be a valid URL').required().test('is-public-url', "Url is not supported because it isn't reachable over the public internet", async (url)=>{
        if (process.env.NODE_ENV !== 'production') {
            return true;
        }
        try {
            const parsedUrl = new URL(punycode.toASCII(url));
            const isLocalUrl = await isLocalhostIp(parsedUrl.hostname);
            return !isLocalUrl;
        } catch  {
            return false;
        }
    }),
    headers: utils.yup.lazy((data)=>{
        if (typeof data !== 'object') {
            return utils.yup.object().required();
        }
        return utils.yup.object(// @ts-expect-error lodash types
        _.mapValues(data, ()=>{
            utils.yup.string().min(1).required();
        })).required();
    }),
    events: utils.yup.array().of(utils.yup.string()).required()
}).noUnknown();
const updateWebhookValidator = webhookValidator.shape({
    isEnabled: utils.yup.boolean()
});
var webhooks = {
    async listWebhooks (ctx) {
        const webhooks = await strapi.get('webhookStore').findWebhooks();
        ctx.send({
            data: webhooks
        });
    },
    async getWebhook (ctx) {
        const { id } = ctx.params;
        const webhook = await strapi.get('webhookStore').findWebhook(id);
        if (!webhook) {
            return ctx.notFound('webhook.notFound');
        }
        ctx.send({
            data: webhook
        });
    },
    async createWebhook (ctx) {
        const { body } = ctx.request;
        await utils.validateYupSchema(webhookValidator)(body);
        const webhook = await strapi.get('webhookStore').createWebhook(body);
        strapi.get('webhookRunner').add(webhook);
        ctx.created({
            data: webhook
        });
    },
    async updateWebhook (ctx) {
        const { id } = ctx.params;
        const { body } = ctx.request;
        await utils.validateYupSchema(updateWebhookValidator)(body);
        const webhook = await strapi.get('webhookStore').findWebhook(id);
        if (!webhook) {
            return ctx.notFound('webhook.notFound');
        }
        const updatedWebhook = await strapi.get('webhookStore').updateWebhook(id, {
            ...webhook,
            ...body
        });
        if (!updatedWebhook) {
            return ctx.notFound('webhook.notFound');
        }
        strapi.get('webhookRunner').update(updatedWebhook);
        ctx.send({
            data: updatedWebhook
        });
    },
    async deleteWebhook (ctx) {
        const { id } = ctx.params;
        const webhook = await strapi.get('webhookStore').findWebhook(id);
        if (!webhook) {
            return ctx.notFound('webhook.notFound');
        }
        await strapi.get('webhookStore').deleteWebhook(id);
        strapi.get('webhookRunner').remove(webhook);
        ctx.body = {
            data: webhook
        };
    },
    async deleteWebhooks (ctx) {
        const { ids } = ctx.request.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return ctx.badRequest('ids must be an array of id');
        }
        for (const id of ids){
            const webhook = await strapi.get('webhookStore').findWebhook(id);
            if (webhook) {
                await strapi.get('webhookStore').deleteWebhook(id);
                strapi.get('webhookRunner').remove(webhook);
            }
        }
        ctx.send({
            data: ids
        });
    },
    async triggerWebhook (ctx) {
        const { id } = ctx.params;
        const webhook = await strapi.get('webhookStore').findWebhook(id);
        const response = await strapi.get('webhookRunner').run(webhook, 'trigger-test', {});
        ctx.body = {
            data: response
        };
    }
};

module.exports = webhooks;
//# sourceMappingURL=webhooks.js.map
