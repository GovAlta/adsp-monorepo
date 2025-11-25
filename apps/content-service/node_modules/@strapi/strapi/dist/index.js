'use strict';

var core = require('@strapi/core');



Object.keys(core).forEach(function (k) {
	if (k !== 'default' && !Object.prototype.hasOwnProperty.call(exports, k)) Object.defineProperty(exports, k, {
		enumerable: true,
		get: function () { return core[k]; }
	});
});
//# sourceMappingURL=index.js.map
