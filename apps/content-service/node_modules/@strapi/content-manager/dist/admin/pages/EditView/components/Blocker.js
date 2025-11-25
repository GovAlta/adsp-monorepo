'use strict';

var jsxRuntime = require('react/jsx-runtime');
var strapiAdmin = require('@strapi/admin/strapi-admin');

// Needs to be wrapped in a component to have access to the form context via a hook.
/**
 * Prevents users from leaving the page with unsaved form changes
 */ const Blocker = ()=>{
    const resetForm = strapiAdmin.useForm('Blocker', (state)=>state.resetForm);
    // We reset the form to the published version to avoid errors like – https://strapi-inc.atlassian.net/browse/CONTENT-2284
    return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Blocker, {
        onProceed: resetForm
    });
};

exports.Blocker = Blocker;
//# sourceMappingURL=Blocker.js.map
