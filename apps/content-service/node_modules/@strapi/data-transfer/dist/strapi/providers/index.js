'use strict';

var index = require('./local-destination/index.js');
var index$1 = require('./local-source/index.js');
var index$2 = require('./remote-destination/index.js');
var index$3 = require('./remote-source/index.js');

// Local

exports.DEFAULT_CONFLICT_STRATEGY = index.DEFAULT_CONFLICT_STRATEGY;
exports.VALID_CONFLICT_STRATEGIES = index.VALID_CONFLICT_STRATEGIES;
exports.createLocalStrapiDestinationProvider = index.createLocalStrapiDestinationProvider;
exports.createLocalStrapiSourceProvider = index$1.createLocalStrapiSourceProvider;
exports.createRemoteStrapiDestinationProvider = index$2.createRemoteStrapiDestinationProvider;
exports.createRemoteStrapiSourceProvider = index$3.createRemoteStrapiSourceProvider;
//# sourceMappingURL=index.js.map
