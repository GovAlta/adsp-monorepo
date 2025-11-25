'use strict';

var jsxRuntime = require('react/jsx-runtime');
var HomePage = require('../../../../admin/src/pages/Home/HomePage.js');
var useLicenseLimitNotification = require('../hooks/useLicenseLimitNotification.js');

const HomePageEE = ()=>{
    useLicenseLimitNotification.useLicenseLimitNotification();
    return /*#__PURE__*/ jsxRuntime.jsx(HomePage.HomePageCE, {});
};

exports.HomePageEE = HomePageEE;
//# sourceMappingURL=HomePage.js.map
