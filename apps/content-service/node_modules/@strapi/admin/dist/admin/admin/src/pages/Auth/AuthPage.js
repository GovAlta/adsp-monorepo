'use strict';

var jsxRuntime = require('react/jsx-runtime');
var reactRouterDom = require('react-router-dom');
var Auth = require('../../features/Auth.js');
var useEnterprise = require('../../hooks/useEnterprise.js');
var admin = require('../../services/admin.js');
var Login = require('./components/Login.js');
var constants = require('./constants.js');

/* -------------------------------------------------------------------------------------------------
 * AuthPage
 * -----------------------------------------------------------------------------------------------*/ const AuthPage = ()=>{
    const { search } = reactRouterDom.useLocation();
    const match = reactRouterDom.useMatch('/auth/:authType');
    const authType = match?.params.authType;
    const { data } = admin.useInitQuery();
    const { hasAdmin } = data ?? {};
    const Login$1 = useEnterprise.useEnterprise(Login.Login, async ()=>(await Promise.resolve().then(function () { return require('../../../../ee/admin/src/pages/AuthPage/components/Login.js'); })).LoginEE);
    const forms = useEnterprise.useEnterprise(constants.FORMS, async ()=>(await Promise.resolve().then(function () { return require('../../../../ee/admin/src/pages/AuthPage/constants.js'); })).FORMS, {
        combine (ceForms, eeForms) {
            return {
                ...ceForms,
                ...eeForms
            };
        },
        defaultValue: constants.FORMS
    });
    const { token } = Auth.useAuth('AuthPage', (auth)=>auth);
    if (!authType || !forms) {
        return /*#__PURE__*/ jsxRuntime.jsx(reactRouterDom.Navigate, {
            to: "/"
        });
    }
    const Component = forms[authType];
    // Redirect the user to the login page if
    // the endpoint does not exists
    if (!Component) {
        return /*#__PURE__*/ jsxRuntime.jsx(reactRouterDom.Navigate, {
            to: "/"
        });
    }
    // User is already logged in
    if (authType !== 'register-admin' && authType !== 'register' && token) {
        return /*#__PURE__*/ jsxRuntime.jsx(reactRouterDom.Navigate, {
            to: "/"
        });
    }
    // there is already an admin user oo
    if (hasAdmin && authType === 'register-admin' && token) {
        return /*#__PURE__*/ jsxRuntime.jsx(reactRouterDom.Navigate, {
            to: "/"
        });
    }
    // Redirect the user to the register-admin if it is the first user
    if (!hasAdmin && authType !== 'register-admin') {
        return /*#__PURE__*/ jsxRuntime.jsx(reactRouterDom.Navigate, {
            to: {
                pathname: '/auth/register-admin',
                // Forward the `?redirectTo` from /auth/login
                // /abc => /auth/login?redirectTo=%2Fabc => /auth/register-admin?redirectTo=%2Fabc
                search
            }
        });
    }
    if (Login$1 && authType === 'login') {
        // Assign the component to render for the login form
        return /*#__PURE__*/ jsxRuntime.jsx(Login$1, {});
    } else if (authType === 'login' && !Login$1) {
        // block rendering until the Login EE component is fully loaded
        return null;
    }
    return /*#__PURE__*/ jsxRuntime.jsx(Component, {
        hasAdmin: hasAdmin
    });
};

exports.AuthPage = AuthPage;
//# sourceMappingURL=AuthPage.js.map
