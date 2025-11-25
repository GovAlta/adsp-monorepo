import * as z from 'zod/v4';

class EmailRouteValidator {
    get sendEmailInput() {
        return z.object({
            from: z.string().optional(),
            to: z.string(),
            cc: z.string().optional(),
            bcc: z.string().optional(),
            replyTo: z.string().optional(),
            subject: z.string(),
            text: z.string(),
            html: z.string().optional()
        }).catchall(z.string());
    }
    get emailResponse() {
        return z.object({});
    }
    constructor(strapi){
        this._strapi = strapi;
    }
}

export { EmailRouteValidator };
//# sourceMappingURL=email.mjs.map
