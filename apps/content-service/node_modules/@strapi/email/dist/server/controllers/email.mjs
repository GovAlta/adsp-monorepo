import { pick } from 'lodash/fp';
import { errors } from '@strapi/utils';

const { ApplicationError } = errors;
/**
 * Email.js controller
 *
 * @description: A set of functions called "actions" of the `email` plugin.
 */ const emailController = {
    async send (ctx) {
        const options = ctx.request.body;
        try {
            await strapi.plugin('email').service('email').send(options);
        } catch (error) {
            if (error instanceof Error) {
                if ('statusCode' in error && error.statusCode === 400) {
                    throw new ApplicationError(error.message);
                } else {
                    throw new Error(`Couldn't send email: ${error.message}.`);
                }
            }
        }
        // Send 200 `ok`
        ctx.send({});
    },
    async test (ctx) {
        const { to } = ctx.request.body;
        if (!to) {
            throw new ApplicationError('No recipient(s) are given');
        }
        const email = {
            to,
            subject: `Strapi test mail to: ${to}`,
            text: `Great! You have correctly configured the Strapi email plugin with the ${strapi.config.get('plugin::email.provider')} provider. \r\nFor documentation on how to use the email plugin checkout: https://docs.strapi.io/developer-docs/latest/plugins/email.html`
        };
        try {
            await strapi.plugin('email').service('email').send(email);
        } catch (error) {
            if (error instanceof Error) {
                if ('statusCode' in error && error.statusCode === 400) {
                    throw new ApplicationError(error.message);
                } else {
                    throw new Error(`Couldn't send test email: ${error.message}.`);
                }
            }
        }
        // Send 200 `ok`
        ctx.send({});
    },
    async getSettings (ctx) {
        const config = strapi.plugin('email').service('email').getProviderSettings();
        ctx.send({
            config: pick([
                'provider',
                'settings.defaultFrom',
                'settings.defaultReplyTo',
                'settings.testAddress'
            ], config)
        });
    }
};

export { emailController as default };
//# sourceMappingURL=email.mjs.map
