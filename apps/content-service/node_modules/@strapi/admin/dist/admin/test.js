'use strict';

var utils = require('./admin/tests/utils.js');
var react = require('@testing-library/react');
var server = require('./admin/tests/server.js');



exports.defaultTestStoreConfig = utils.defaultTestStoreConfig;
exports.render = utils.render;
exports.renderHook = utils.renderHook;
Object.defineProperty(exports, "act", {
	enumerable: true,
	get: function () { return react.act; }
});
Object.defineProperty(exports, "fireEvent", {
	enumerable: true,
	get: function () { return react.fireEvent; }
});
Object.defineProperty(exports, "screen", {
	enumerable: true,
	get: function () { return react.screen; }
});
Object.defineProperty(exports, "waitFor", {
	enumerable: true,
	get: function () { return react.waitFor; }
});
exports.server = server.server;
//# sourceMappingURL=test.js.map
