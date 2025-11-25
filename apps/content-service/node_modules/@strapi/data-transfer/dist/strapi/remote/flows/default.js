'use strict';

var DEFAULT_TRANSFER_FLOW = [
    {
        kind: 'action',
        action: 'bootstrap'
    },
    {
        kind: 'action',
        action: 'init'
    },
    {
        kind: 'action',
        action: 'beforeTransfer'
    },
    {
        kind: 'transfer',
        stage: 'schemas'
    },
    {
        kind: 'transfer',
        stage: 'entities'
    },
    {
        kind: 'transfer',
        stage: 'assets'
    },
    {
        kind: 'transfer',
        stage: 'links'
    },
    {
        kind: 'transfer',
        stage: 'configuration'
    },
    {
        kind: 'action',
        action: 'close'
    }
];

module.exports = DEFAULT_TRANSFER_FLOW;
//# sourceMappingURL=default.js.map
