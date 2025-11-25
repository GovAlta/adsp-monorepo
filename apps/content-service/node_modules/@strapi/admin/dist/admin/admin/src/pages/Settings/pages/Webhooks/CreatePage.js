'use strict';

var jsxRuntime = require('react/jsx-runtime');
var PageHelpers = require('../../../../components/PageHelpers.js');
var hooks = require('../../../../core/store/hooks.js');
var EditPage = require('./EditPage.js');

const ProtectedCreatePage = ()=>{
    const permissions = hooks.useTypedSelector((state)=>state.admin_app.permissions.settings?.webhooks.create);
    return /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsxRuntime.jsx(EditPage.EditPage, {})
    });
};

exports.ProtectedCreatePage = ProtectedCreatePage;
//# sourceMappingURL=CreatePage.js.map
