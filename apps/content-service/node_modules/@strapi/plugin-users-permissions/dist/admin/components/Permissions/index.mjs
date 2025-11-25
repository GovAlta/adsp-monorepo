import { jsx, jsxs } from 'react/jsx-runtime';
import { useReducer } from 'react';
import { Accordion, Flex } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useUsersPermissions } from '../../contexts/UsersPermissionsContext/index.mjs';
import formatPluginName from '../../utils/formatPluginName.mjs';
import init from './init.mjs';
import PermissionRow from './PermissionRow/index.mjs';
import { reducer, initialState } from './reducer.mjs';

const Permissions = ()=>{
    const { modifiedData } = useUsersPermissions();
    const { formatMessage } = useIntl();
    const [{ collapses }] = useReducer(reducer, initialState, (state)=>init(state, modifiedData));
    return /*#__PURE__*/ jsx(Accordion.Root, {
        size: "M",
        children: /*#__PURE__*/ jsx(Flex, {
            direction: "column",
            alignItems: "stretch",
            gap: 1,
            children: collapses.map((collapse, index)=>/*#__PURE__*/ jsxs(Accordion.Item, {
                    value: collapse.name,
                    children: [
                        /*#__PURE__*/ jsx(Accordion.Header, {
                            variant: index % 2 === 0 ? 'secondary' : undefined,
                            children: /*#__PURE__*/ jsx(Accordion.Trigger, {
                                caretPosition: "right",
                                description: formatMessage({
                                    id: 'users-permissions.Plugin.permissions.plugins.description',
                                    defaultMessage: 'Define all allowed actions for the {name} plugin.'
                                }, {
                                    name: collapse.name
                                }),
                                children: formatPluginName(collapse.name)
                            })
                        }),
                        /*#__PURE__*/ jsx(Accordion.Content, {
                            children: /*#__PURE__*/ jsx(PermissionRow, {
                                permissions: modifiedData[collapse.name],
                                name: collapse.name
                            })
                        })
                    ]
                }, collapse.name))
        })
    });
};

export { Permissions as default };
//# sourceMappingURL=index.mjs.map
