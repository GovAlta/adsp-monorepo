import type { EmailConfig, EmailOptions, EmailTemplate, EmailTemplateData, SendOptions } from '../types';
declare const emailService: () => {
    getProviderSettings: () => EmailConfig;
    send: (options: SendOptions) => Promise<any>;
    sendTemplatedEmail: (emailOptions: EmailOptions, emailTemplate: EmailTemplate, data: EmailTemplateData) => any;
};
export default emailService;
//# sourceMappingURL=email.d.ts.map