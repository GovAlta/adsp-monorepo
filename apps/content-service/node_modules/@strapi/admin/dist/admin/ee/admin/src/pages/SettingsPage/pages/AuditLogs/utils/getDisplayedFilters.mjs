import { getDisplayName } from '../../../../../../../../admin/src/utils/users.mjs';
import { ComboboxFilter } from '../components/ComboboxFilter.mjs';
import { actionTypes, getDefaultMessage } from './getActionTypesDefaultMessages.mjs';

const getDisplayedFilters = ({ formatMessage, users, canReadUsers })=>{
    const operators = [
        {
            label: formatMessage({
                id: 'components.FilterOptions.FILTER_TYPES.$eq',
                defaultMessage: 'is'
            }),
            value: '$eq'
        },
        {
            label: formatMessage({
                id: 'components.FilterOptions.FILTER_TYPES.$ne',
                defaultMessage: 'is not'
            }),
            value: '$ne'
        }
    ];
    const filters = [
        {
            input: ComboboxFilter,
            label: formatMessage({
                id: 'Settings.permissions.auditLogs.action',
                defaultMessage: 'Action'
            }),
            name: 'action',
            operators,
            options: Object.keys(actionTypes).map((action)=>({
                    label: formatMessage({
                        id: `Settings.permissions.auditLogs.${action}`,
                        defaultMessage: getDefaultMessage(action)
                    }, {
                        model: undefined
                    }),
                    value: action
                })),
            type: 'enumeration'
        },
        {
            label: formatMessage({
                id: 'Settings.permissions.auditLogs.date',
                defaultMessage: 'Date'
            }),
            name: 'date',
            type: 'datetime'
        }
    ];
    if (canReadUsers && users) {
        return [
            ...filters,
            {
                input: ComboboxFilter,
                label: formatMessage({
                    id: 'Settings.permissions.auditLogs.user',
                    defaultMessage: 'User'
                }),
                mainField: {
                    name: 'id',
                    type: 'integer'
                },
                name: 'user',
                operators,
                options: users.map((user)=>({
                        label: getDisplayName(user),
                        value: user.id.toString()
                    })),
                type: 'relation'
            }
        ];
    }
    return filters;
};

export { getDisplayedFilters };
//# sourceMappingURL=getDisplayedFilters.mjs.map
