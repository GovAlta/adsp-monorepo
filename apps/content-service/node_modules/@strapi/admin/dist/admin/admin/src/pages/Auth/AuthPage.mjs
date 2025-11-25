import { jsx } from 'react/jsx-runtime';
import { useLocation, useMatch, Navigate } from 'react-router-dom';
import { useAuth } from '../../features/Auth.mjs';
import { useEnterprise } from '../../hooks/useEnterprise.mjs';
import { useInitQuery } from '../../services/admin.mjs';
import { Login } from './components/Login.mjs';
import { FORMS } from './constants.mjs';

/* -------------------------------------------------------------------------------------------------
 * AuthPage
 * -----------------------------------------------------------------------------------------------*/ const AuthPage = ()=>{
    const { search } = useLocation();
    const match = useMatch('/auth/:authType');
    const authType = match?.params.authType;
    const { data } = useInitQuery();
    const { hasAdmin } = data ?? {};
    const Login$1 = useEnterprise(Login, async ()=>(await import('../../../../ee/admin/src/pages/AuthPage/components/Login.mjs')).LoginEE);
    const forms = useEnterprise(FORMS, async ()=>(await import('../../../../ee/admin/src/pages/AuthPage/constants.mjs')).FORMS, {
        combine (ceForms, eeForms) {
            return {
                ...ceForms,
                ...eeForms
            };
        },
        defaultValue: FORMS
    });
    const { token } = useAuth('AuthPage', (auth)=>auth);
    if (!authType || !forms) {
        return /*#__PURE__*/ jsx(Navigate, {
            to: "/"
        });
    }
    const Component = forms[authType];
    // Redirect the user to the login page if
    // the endpoint does not exists
    if (!Component) {
        return /*#__PURE__*/ jsx(Navigate, {
            to: "/"
        });
    }
    // User is already logged in
    if (authType !== 'register-admin' && authType !== 'register' && token) {
        return /*#__PURE__*/ jsx(Navigate, {
            to: "/"
        });
    }
    // there is already an admin user oo
    if (hasAdmin && authType === 'register-admin' && token) {
        return /*#__PURE__*/ jsx(Navigate, {
            to: "/"
        });
    }
    // Redirect the user to the register-admin if it is the first user
    if (!hasAdmin && authType !== 'register-admin') {
        return /*#__PURE__*/ jsx(Navigate, {
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
        return /*#__PURE__*/ jsx(Login$1, {});
    } else if (authType === 'login' && !Login$1) {
        // block rendering until the Login EE component is fully loaded
        return null;
    }
    return /*#__PURE__*/ jsx(Component, {
        hasAdmin: hasAdmin
    });
};

export { AuthPage };
//# sourceMappingURL=AuthPage.mjs.map
