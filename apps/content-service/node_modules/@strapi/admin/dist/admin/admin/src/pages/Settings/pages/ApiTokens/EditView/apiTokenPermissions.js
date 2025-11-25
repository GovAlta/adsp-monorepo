'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var reactContext = require('@radix-ui/react-context');

const [ApiTokenPermissionsContextProvider, useApiTokenPermissionsContext] = reactContext.createContext('ApiTokenPermissionsContext');
const ApiTokenPermissionsProvider = ({ children, ...rest })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(ApiTokenPermissionsContextProvider, {
        ...rest,
        children: children
    });
};
const useApiTokenPermissions = ()=>useApiTokenPermissionsContext('useApiTokenPermissions');

exports.ApiTokenPermissionsProvider = ApiTokenPermissionsProvider;
exports.useApiTokenPermissions = useApiTokenPermissions;
//# sourceMappingURL=apiTokenPermissions.js.map
