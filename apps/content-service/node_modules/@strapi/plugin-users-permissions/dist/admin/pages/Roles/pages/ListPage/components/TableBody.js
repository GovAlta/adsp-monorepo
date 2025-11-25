'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var PropTypes = require('prop-types');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var styledComponents = require('styled-components');

const EditLink = styledComponents.styled(designSystem.Link)`
  align-items: center;
  height: 3.2rem;
  width: 3.2rem;
  display: flex;
  justify-content: center;
  padding: ${({ theme })=>`${theme.spaces[2]}`};

  svg {
    height: 1.6rem;
    width: 1.6rem;

    path {
      fill: ${({ theme })=>theme.colors.neutral500};
    }
  }

  &:hover,
  &:focus {
    svg {
      path {
        fill: ${({ theme })=>theme.colors.neutral800};
      }
    }
  }
`;
const TableBody = ({ sortedRoles, canDelete, canUpdate, setRoleToDelete, onDelete })=>{
    const { formatMessage } = reactIntl.useIntl();
    const navigate = reactRouterDom.useNavigate();
    const [showConfirmDelete, setShowConfirmDelete] = onDelete;
    const checkCanDeleteRole = (role)=>canDelete && ![
            'public',
            'authenticated'
        ].includes(role.type);
    const handleClickDelete = (id)=>{
        setRoleToDelete(id);
        setShowConfirmDelete(!showConfirmDelete);
    };
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tbody, {
        children: sortedRoles?.map((role)=>/*#__PURE__*/ jsxRuntime.jsxs(designSystem.Tr, {
                cursor: "pointer",
                onClick: ()=>navigate(role.id.toString()),
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                        width: "20%",
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                            children: role.name
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                        width: "50%",
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                            children: role.description
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                        width: "30%",
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                            children: formatMessage({
                                id: 'Roles.RoleRow.user-count',
                                defaultMessage: '{number, plural, =0 {# user} one {# user} other {# users}}'
                            }, {
                                number: role.nb_users
                            })
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                            justifyContent: "end",
                            onClick: (e)=>e.stopPropagation(),
                            children: [
                                canUpdate ? /*#__PURE__*/ jsxRuntime.jsx(EditLink, {
                                    tag: reactRouterDom.NavLink,
                                    to: role.id.toString(),
                                    "aria-label": formatMessage({
                                        id: 'app.component.table.edit',
                                        defaultMessage: 'Edit {target}'
                                    }, {
                                        target: `${role.name}`
                                    }),
                                    children: /*#__PURE__*/ jsxRuntime.jsx(icons.Pencil, {})
                                }) : null,
                                checkCanDeleteRole(role) && /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                    onClick: ()=>handleClickDelete(role.id.toString()),
                                    variant: "ghost",
                                    label: formatMessage({
                                        id: 'global.delete-target',
                                        defaultMessage: 'Delete {target}'
                                    }, {
                                        target: `${role.name}`
                                    }),
                                    children: /*#__PURE__*/ jsxRuntime.jsx(icons.Trash, {})
                                })
                            ]
                        })
                    })
                ]
            }, role.name))
    });
};
TableBody.defaultProps = {
    canDelete: false,
    canUpdate: false
};
TableBody.propTypes = {
    onDelete: PropTypes.array.isRequired,
    setRoleToDelete: PropTypes.func.isRequired,
    sortedRoles: PropTypes.array.isRequired,
    canDelete: PropTypes.bool,
    canUpdate: PropTypes.bool
};

module.exports = TableBody;
//# sourceMappingURL=TableBody.js.map
