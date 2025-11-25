import { jsx, jsxs } from 'react/jsx-runtime';
import 'react';
import { Link, Tbody, Tr, Td, Typography, Flex, IconButton } from '@strapi/design-system';
import { Pencil, Trash } from '@strapi/icons';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useNavigate, NavLink } from 'react-router-dom';
import { styled } from 'styled-components';

const EditLink = styled(Link)`
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
    const { formatMessage } = useIntl();
    const navigate = useNavigate();
    const [showConfirmDelete, setShowConfirmDelete] = onDelete;
    const checkCanDeleteRole = (role)=>canDelete && ![
            'public',
            'authenticated'
        ].includes(role.type);
    const handleClickDelete = (id)=>{
        setRoleToDelete(id);
        setShowConfirmDelete(!showConfirmDelete);
    };
    return /*#__PURE__*/ jsx(Tbody, {
        children: sortedRoles?.map((role)=>/*#__PURE__*/ jsxs(Tr, {
                cursor: "pointer",
                onClick: ()=>navigate(role.id.toString()),
                children: [
                    /*#__PURE__*/ jsx(Td, {
                        width: "20%",
                        children: /*#__PURE__*/ jsx(Typography, {
                            children: role.name
                        })
                    }),
                    /*#__PURE__*/ jsx(Td, {
                        width: "50%",
                        children: /*#__PURE__*/ jsx(Typography, {
                            children: role.description
                        })
                    }),
                    /*#__PURE__*/ jsx(Td, {
                        width: "30%",
                        children: /*#__PURE__*/ jsx(Typography, {
                            children: formatMessage({
                                id: 'Roles.RoleRow.user-count',
                                defaultMessage: '{number, plural, =0 {# user} one {# user} other {# users}}'
                            }, {
                                number: role.nb_users
                            })
                        })
                    }),
                    /*#__PURE__*/ jsx(Td, {
                        children: /*#__PURE__*/ jsxs(Flex, {
                            justifyContent: "end",
                            onClick: (e)=>e.stopPropagation(),
                            children: [
                                canUpdate ? /*#__PURE__*/ jsx(EditLink, {
                                    tag: NavLink,
                                    to: role.id.toString(),
                                    "aria-label": formatMessage({
                                        id: 'app.component.table.edit',
                                        defaultMessage: 'Edit {target}'
                                    }, {
                                        target: `${role.name}`
                                    }),
                                    children: /*#__PURE__*/ jsx(Pencil, {})
                                }) : null,
                                checkCanDeleteRole(role) && /*#__PURE__*/ jsx(IconButton, {
                                    onClick: ()=>handleClickDelete(role.id.toString()),
                                    variant: "ghost",
                                    label: formatMessage({
                                        id: 'global.delete-target',
                                        defaultMessage: 'Delete {target}'
                                    }, {
                                        target: `${role.name}`
                                    }),
                                    children: /*#__PURE__*/ jsx(Trash, {})
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

export { TableBody as default };
//# sourceMappingURL=TableBody.mjs.map
