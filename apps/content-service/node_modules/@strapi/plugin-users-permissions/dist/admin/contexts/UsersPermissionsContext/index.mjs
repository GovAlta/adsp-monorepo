import { jsx } from 'react/jsx-runtime';
import { createContext, useContext } from 'react';
import PropTypes from 'prop-types';

const UsersPermissions = /*#__PURE__*/ createContext({});
const UsersPermissionsProvider = ({ children, value })=>{
    return /*#__PURE__*/ jsx(UsersPermissions.Provider, {
        value: value,
        children: children
    });
};
const useUsersPermissions = ()=>useContext(UsersPermissions);
UsersPermissionsProvider.propTypes = {
    children: PropTypes.node.isRequired,
    value: PropTypes.object.isRequired
};

export { UsersPermissions, UsersPermissionsProvider, useUsersPermissions };
//# sourceMappingURL=index.mjs.map
