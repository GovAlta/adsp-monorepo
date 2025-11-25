import { jsxs, jsx } from 'react/jsx-runtime';
import { Field, MultiSelect, MultiSelectOption } from '@strapi/design-system';
import { Loader as Loader$1 } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { keyframes, styled } from 'styled-components';
import { useField } from '../../../../../components/Form.mjs';
import { useAdminRoles } from '../../../../../hooks/useAdminRoles.mjs';

const SelectRoles = ({ disabled })=>{
    const { isLoading, roles } = useAdminRoles();
    const { formatMessage } = useIntl();
    const { value = [], onChange, error } = useField('roles');
    return /*#__PURE__*/ jsxs(Field.Root, {
        error: error,
        hint: formatMessage({
            id: 'app.components.Users.ModalCreateBody.block-title.roles.description',
            defaultMessage: 'A user can have one or several roles'
        }),
        name: "roles",
        required: true,
        children: [
            /*#__PURE__*/ jsx(Field.Label, {
                children: formatMessage({
                    id: 'app.components.Users.ModalCreateBody.block-title.roles',
                    defaultMessage: "User's roles"
                })
            }),
            /*#__PURE__*/ jsx(MultiSelect, {
                disabled: disabled,
                onChange: (v)=>{
                    onChange('roles', v);
                },
                placeholder: formatMessage({
                    id: 'app.components.Select.placeholder',
                    defaultMessage: 'Select'
                }),
                startIcon: isLoading ? /*#__PURE__*/ jsx(Loader, {}) : undefined,
                value: value.map((v)=>v.toString()),
                withTags: true,
                children: roles.map((role)=>{
                    return /*#__PURE__*/ jsx(MultiSelectOption, {
                        value: role.id.toString(),
                        children: formatMessage({
                            id: `global.${role.code}`,
                            defaultMessage: role.name
                        })
                    }, role.id);
                })
            }),
            /*#__PURE__*/ jsx(Field.Error, {}),
            /*#__PURE__*/ jsx(Field.Hint, {})
        ]
    });
};
const rotation = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(359deg);
  }
`;
const LoadingWrapper = styled.div`
  animation: ${rotation} 2s infinite linear;
`;
const Loader = ()=>/*#__PURE__*/ jsx(LoadingWrapper, {
        children: /*#__PURE__*/ jsx(Loader$1, {})
    });

export { SelectRoles };
//# sourceMappingURL=SelectRoles.mjs.map
