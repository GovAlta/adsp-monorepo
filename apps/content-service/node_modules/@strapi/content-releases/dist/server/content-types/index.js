'use strict';

var index = require('./release/index.js');
var index$1 = require('./release-action/index.js');

const contentTypes = {
    release: index.release,
    'release-action': index$1.releaseAction
};

exports.contentTypes = contentTypes;
//# sourceMappingURL=index.js.map
