'use strict';

var test = require('@strapi/admin/strapi-admin/test');



Object.keys(test).forEach(function (k) {
	if (k !== 'default' && !Object.prototype.hasOwnProperty.call(exports, k)) Object.defineProperty(exports, k, {
		enumerable: true,
		get: function () { return test[k]; }
	});
});
//# sourceMappingURL=admin-test.js.map
