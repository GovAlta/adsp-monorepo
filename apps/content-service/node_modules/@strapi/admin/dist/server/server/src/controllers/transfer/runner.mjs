import { strapi } from '@strapi/data-transfer';
import { errors } from '@strapi/utils';
import dataTransferAuthStrategy from '../../strategies/data-transfer.mjs';

const { remote: { handlers: { createPushController, createPullController } } } = strapi;
const { UnauthorizedError } = errors;
/**
 * @param ctx the koa context
 * @param scope the scope to verify
 */ const verify = async (ctx, scope)=>{
    const { auth } = ctx.state;
    if (!auth) {
        throw new UnauthorizedError();
    }
    await dataTransferAuthStrategy.verify(auth, {
        scope
    });
};
const push = createPushController({
    verify
});
const pull = createPullController({
    verify
});
var runner = {
    push,
    pull
};

export { runner as default, pull, push };
//# sourceMappingURL=runner.mjs.map
