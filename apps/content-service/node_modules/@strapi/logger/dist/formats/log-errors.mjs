import { format } from 'winston';

const logErrors = format((info)=>{
    if (info instanceof Error) {
        return {
            ...info,
            message: `${info.message}${info.stack ? `\n${info.stack}` : ''}`
        };
    }
    return info;
});

export { logErrors as default };
//# sourceMappingURL=log-errors.mjs.map
