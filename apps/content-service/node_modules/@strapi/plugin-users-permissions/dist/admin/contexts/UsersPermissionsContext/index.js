'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var PropTypes = require('prop-types');

const UsersPermissions = /*#__PURE__*/ React.createContext({});
const UsersPermissionsProvider = ({ children, value })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(UsersPermissions.Provider, {
        value: value,
        children: children
    });
};
const useUsersPermissions = ()=>React.useContext(UsersPermissions);
UsersPermissionsProvider.propTypes = {
    children: PropTypes.node.isRequired,
    value: PropTypes.object.isRequired
};

exports.UsersPermissions = UsersPermissions;
exports.UsersPermissionsProvider = UsersPermissionsProvider;
exports.useUsersPermissions = useUsersPermissions;
//# sourceMappingURL=index.js.map
