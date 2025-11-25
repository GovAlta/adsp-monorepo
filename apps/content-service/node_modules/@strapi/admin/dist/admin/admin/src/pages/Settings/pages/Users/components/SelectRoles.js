'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var styled = require('styled-components');
var Form = require('../../../../../components/Form.js');
var useAdminRoles = require('../../../../../hooks/useAdminRoles.js');

const SelectRoles = ({ disabled })=>{
    const { isLoading, roles } = useAdminRoles.useAdminRoles();
    const { formatMessage } = reactIntl.useIntl();
    const { value = [], onChange, error } = Form.useField('roles');
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
        error: error,
        hint: formatMessage({
            id: 'app.components.Users.ModalCreateBody.block-title.roles.description',
            defaultMessage: 'A user can have one or several roles'
        }),
        name: "roles",
        required: true,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                children: formatMessage({
                    id: 'app.components.Users.ModalCreateBody.block-title.roles',
                    defaultMessage: "User's roles"
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.MultiSelect, {
                disabled: disabled,
                onChange: (v)=>{
                    onChange('roles', v);
                },
                placeholder: formatMessage({
                    id: 'app.components.Select.placeholder',
                    defaultMessage: 'Select'
                }),
                startIcon: isLoading ? /*#__PURE__*/ jsxRuntime.jsx(Loader, {}) : undefined,
                value: value.map((v)=>v.toString()),
                withTags: true,
                children: roles.map((role)=>{
                    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.MultiSelectOption, {
                        value: role.id.toString(),
                        children: formatMessage({
                            id: `global.${role.code}`,
                            defaultMessage: role.name
                        })
                    }, role.id);
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {}),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Hint, {})
        ]
    });
};
const rotation = styled.keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(359deg);
  }
`;
const LoadingWrapper = styled.styled.div`
  animation: ${rotation} 2s infinite linear;
`;
const Loader = ()=>/*#__PURE__*/ jsxRuntime.jsx(LoadingWrapper, {
        children: /*#__PURE__*/ jsxRuntime.jsx(icons.Loader, {})
    });

exports.SelectRoles = SelectRoles;
//# sourceMappingURL=SelectRoles.js.map
