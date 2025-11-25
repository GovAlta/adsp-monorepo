import { jsx } from 'react/jsx-runtime';
import 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../features/Auth.mjs';

const PrivateRoute = ({ children })=>{
    const token = useAuth('PrivateRoute', (state)=>state.token);
    const { pathname, search } = useLocation();
    return token !== null ? children : /*#__PURE__*/ jsx(Navigate, {
        to: {
            pathname: '/auth/login',
            search: pathname !== '/' ? `?redirectTo=${encodeURIComponent(`${pathname}${search}`)}` : undefined
        }
    });
};

export { PrivateRoute };
//# sourceMappingURL=PrivateRoute.mjs.map
