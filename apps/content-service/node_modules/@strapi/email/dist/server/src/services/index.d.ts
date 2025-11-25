export declare const services: {
    email: () => {
        getProviderSettings: () => import("../types").EmailConfig;
        send: (options: import("../types").SendOptions) => Promise<any>;
        sendTemplatedEmail: (emailOptions: import("../types").EmailOptions, emailTemplate: import("../types").EmailTemplate, data: import("../types").EmailTemplateData) => any;
    };
};
//# sourceMappingURL=index.d.ts.map