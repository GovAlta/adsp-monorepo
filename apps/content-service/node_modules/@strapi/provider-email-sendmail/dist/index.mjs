import sendmailFactory from 'sendmail';

var index = {
    init (providerOptions, settings) {
        const sendmail = sendmailFactory({
            silent: true,
            ...providerOptions
        });
        return {
            send (options) {
                return new Promise((resolve, reject)=>{
                    const { from, to, cc, bcc, replyTo, subject, text, html, ...rest } = options;
                    const msg = {
                        from: from || settings.defaultFrom,
                        to,
                        cc,
                        bcc,
                        replyTo: replyTo || settings.defaultReplyTo,
                        subject,
                        text,
                        html,
                        ...rest
                    };
                    sendmail(msg, (err)=>{
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            }
        };
    }
};

export { index as default };
//# sourceMappingURL=index.mjs.map
