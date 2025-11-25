import type { Core } from '@strapi/types';
import * as z from 'zod/v4';
export declare class EmailRouteValidator {
    protected readonly _strapi: Core.Strapi;
    constructor(strapi: Core.Strapi);
    get sendEmailInput(): z.ZodObject<{
        from: z.ZodOptional<z.ZodString>;
        to: z.ZodString;
        cc: z.ZodOptional<z.ZodString>;
        bcc: z.ZodOptional<z.ZodString>;
        replyTo: z.ZodOptional<z.ZodString>;
        subject: z.ZodString;
        text: z.ZodString;
        html: z.ZodOptional<z.ZodString>;
    }, z.core.$catchall<z.ZodString>>;
    get emailResponse(): z.ZodObject<{}, z.core.$strip>;
}
//# sourceMappingURL=email.d.ts.map