'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var dataTransfer = require('@strapi/data-transfer');
var utils = require('@strapi/utils');
var dataTransfer$1 = require('../../strategies/data-transfer.js');

const { remote: { handlers: { createPushController, createPullController } } } = dataTransfer.strapi;
const { UnauthorizedError } = utils.errors;
/**
 * @param ctx the koa context
 * @param scope the scope to verify
 */ const verify = async (ctx, scope)=>{
    const { auth } = ctx.state;
    if (!auth) {
        throw new UnauthorizedError();
    }
    await dataTransfer$1.default.verify(auth, {
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

exports.default = runner;
exports.pull = pull;
exports.push = push;
//# sourceMappingURL=runner.js.map
