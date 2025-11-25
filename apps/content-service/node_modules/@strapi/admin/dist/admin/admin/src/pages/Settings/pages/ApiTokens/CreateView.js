'use strict';

var jsxRuntime = require('react/jsx-runtime');
var PageHelpers = require('../../../../components/PageHelpers.js');
var hooks = require('../../../../core/store/hooks.js');
var EditViewPage = require('./EditView/EditViewPage.js');

const ProtectedCreateView = ()=>{
    const permissions = hooks.useTypedSelector((state)=>state.admin_app.permissions.settings?.['api-tokens'].create);
    return /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsxRuntime.jsx(EditViewPage.EditView, {})
    });
};

exports.ProtectedCreateView = ProtectedCreateView;
//# sourceMappingURL=CreateView.js.map
