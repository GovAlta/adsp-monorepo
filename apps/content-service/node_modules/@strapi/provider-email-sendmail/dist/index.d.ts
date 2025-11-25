import { Options } from 'sendmail';
interface Settings {
    defaultFrom: string;
    defaultReplyTo: string;
}
interface SendOptions {
    from?: string;
    to: string;
    cc: string;
    bcc: string;
    replyTo?: string;
    subject: string;
    text: string;
    html: string;
    [key: string]: unknown;
}
type ProviderOptions = Options;
declare const _default: {
    init(providerOptions: ProviderOptions, settings: Settings): {
        send(options: SendOptions): Promise<void>;
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map