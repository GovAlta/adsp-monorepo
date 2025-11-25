'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var reactRouterDom = require('react-router-dom');
var Auth = require('../features/Auth.js');

const PrivateRoute = ({ children })=>{
    const token = Auth.useAuth('PrivateRoute', (state)=>state.token);
    const { pathname, search } = reactRouterDom.useLocation();
    return token !== null ? children : /*#__PURE__*/ jsxRuntime.jsx(reactRouterDom.Navigate, {
        to: {
            pathname: '/auth/login',
            search: pathname !== '/' ? `?redirectTo=${encodeURIComponent(`${pathname}${search}`)}` : undefined
        }
    });
};

exports.PrivateRoute = PrivateRoute;
//# sourceMappingURL=PrivateRoute.js.map
