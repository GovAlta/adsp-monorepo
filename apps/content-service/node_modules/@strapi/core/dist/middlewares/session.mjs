import { isArray, isEmpty } from 'lodash/fp';
import koaSession from 'koa-session';

const defaultConfig = {
    key: 'koa.sess',
    maxAge: 86400000,
    autoCommit: true,
    overwrite: true,
    httpOnly: true,
    signed: true,
    rolling: false,
    renew: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: undefined
};
const session = (userConfig, { strapi })=>{
    const { keys } = strapi.server.app;
    if (!isArray(keys) || isEmpty(keys) || keys.some(isEmpty)) {
        throw new Error(`App keys are required. Please set app.keys in config/server.js (ex: keys: ['myKeyA', 'myKeyB'])`);
    }
    const config = {
        ...defaultConfig,
        ...userConfig
    };
    strapi.server.use(koaSession(config, strapi.server.app));
};

export { session };
//# sourceMappingURL=session.mjs.map
