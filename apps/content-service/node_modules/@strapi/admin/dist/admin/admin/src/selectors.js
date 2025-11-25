'use strict';

var hooks = require('./core/store/hooks.js');

/**
 * @deprecated
 *
 * Use `useTypedSelector` and access the state directly, this was only used so we knew
 * we were using the correct path. Which is state.admin_app.permissions
 */ const selectAdminPermissions = hooks.createTypedSelector((state)=>state.admin_app.permissions);

exports.selectAdminPermissions = selectAdminPermissions;
//# sourceMappingURL=selectors.js.map
