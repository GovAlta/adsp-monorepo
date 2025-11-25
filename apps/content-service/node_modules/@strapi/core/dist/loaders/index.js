'use strict';

var srcIndex = require('./src-index.js');
var apis = require('./apis.js');
var middlewares = require('./middlewares.js');
var components = require('./components.js');
var policies = require('./policies.js');
var index = require('./plugins/index.js');
var sanitizers = require('./sanitizers.js');
var validators = require('./validators.js');

async function loadApplicationContext(strapi) {
    await Promise.all([
        srcIndex(strapi),
        sanitizers(strapi),
        validators(strapi),
        index(strapi),
        apis(strapi),
        components(strapi),
        middlewares(strapi),
        policies(strapi)
    ]);
}

exports.loadApplicationContext = loadApplicationContext;
//# sourceMappingURL=index.js.map
