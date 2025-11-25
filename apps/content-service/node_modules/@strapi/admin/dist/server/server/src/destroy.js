'use strict';

var index = require('./utils/index.js');

var destroy = (async ()=>{
    const { conditionProvider, actionProvider } = index.getService('permission');
    await conditionProvider.clear();
    await actionProvider.clear();
});

module.exports = destroy;
//# sourceMappingURL=destroy.js.map
