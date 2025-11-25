'use strict';

// This file will manage the CLI context state.
let ctx;
function setContext(newCtx) {
    ctx = newCtx;
}
function getContext() {
    return ctx;
}

exports.getContext = getContext;
exports.setContext = setContext;
//# sourceMappingURL=context.js.map
