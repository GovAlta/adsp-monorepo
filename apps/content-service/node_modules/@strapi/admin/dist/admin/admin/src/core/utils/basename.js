'use strict';

const getBasename = ()=>(process.env.ADMIN_PATH ?? '').replace(window.location.origin, '');

exports.getBasename = getBasename;
//# sourceMappingURL=basename.js.map
