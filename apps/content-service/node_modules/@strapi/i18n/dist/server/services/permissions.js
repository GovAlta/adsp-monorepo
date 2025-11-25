'use strict';

var actions = require('./permissions/actions.js');
var sectionsBuilder = require('./permissions/sections-builder.js');
var engine = require('./permissions/engine.js');

const permissions = ()=>({
        actions: actions,
        sectionsBuilder: sectionsBuilder,
        engine: engine
    });

module.exports = permissions;
//# sourceMappingURL=permissions.js.map
