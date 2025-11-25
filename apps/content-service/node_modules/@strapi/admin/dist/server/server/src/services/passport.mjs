import passport$1 from 'koa-passport';
import { isFunction } from 'lodash/fp';
import createLocalStrategy from './passport/local-strategy.mjs';

const authEventsMapper = {
    onConnectionSuccess: 'admin.auth.success',
    onConnectionError: 'admin.auth.error'
};
const valueIsFunctionType = ([, value])=>isFunction(value);
const keyIsValidEventName = ([key])=>{
    return Object.keys(strapi.service('admin::passport').authEventsMapper).includes(key);
};
const getPassportStrategies = ()=>[
        createLocalStrategy(strapi)
    ];
const registerAuthEvents = ()=>{
    // @ts-expect-error - TODO: migrate auth service to TS
    const { events = {} } = strapi.config.get('admin.auth', {});
    const { authEventsMapper } = strapi.service('admin::passport');
    const eventList = Object.entries(events).filter(keyIsValidEventName).filter(valueIsFunctionType);
    for (const [eventName, handler] of eventList){
        // TODO - TS: ensure the handler is an EventHub.Listener
        strapi.eventHub.on(authEventsMapper[eventName], handler);
    }
};
const init = ()=>{
    strapi.service('admin::passport').getPassportStrategies().forEach((strategy)=>passport$1.use(strategy));
    registerAuthEvents();
    return passport$1.initialize();
};
var passport = {
    init,
    getPassportStrategies,
    authEventsMapper
};

export { passport as default };
//# sourceMappingURL=passport.mjs.map
