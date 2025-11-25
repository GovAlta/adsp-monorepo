'use strict';

var jsxRuntime = require('react/jsx-runtime');
var ListPage = require('../../../../../../../admin/src/pages/Settings/pages/Users/ListPage.js');
var useLicenseLimitNotification = require('../../../../hooks/useLicenseLimitNotification.js');

const UserListPageEE = ()=>{
    useLicenseLimitNotification.useLicenseLimitNotification();
    return /*#__PURE__*/ jsxRuntime.jsx(ListPage.ListPageCE, {});
};

exports.UserListPageEE = UserListPageEE;
//# sourceMappingURL=ListPage.js.map
