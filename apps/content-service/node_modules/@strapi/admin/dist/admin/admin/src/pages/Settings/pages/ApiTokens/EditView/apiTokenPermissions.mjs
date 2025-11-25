import { jsx } from 'react/jsx-runtime';
import 'react';
import { createContext } from '@radix-ui/react-context';

const [ApiTokenPermissionsContextProvider, useApiTokenPermissionsContext] = createContext('ApiTokenPermissionsContext');
const ApiTokenPermissionsProvider = ({ children, ...rest })=>{
    return /*#__PURE__*/ jsx(ApiTokenPermissionsContextProvider, {
        ...rest,
        children: children
    });
};
const useApiTokenPermissions = ()=>useApiTokenPermissionsContext('useApiTokenPermissions');

export { ApiTokenPermissionsProvider, useApiTokenPermissions };
//# sourceMappingURL=apiTokenPermissions.mjs.map
