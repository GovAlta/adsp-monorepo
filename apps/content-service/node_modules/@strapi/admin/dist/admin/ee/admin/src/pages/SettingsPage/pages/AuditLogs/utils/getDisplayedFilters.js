'use strict';

var users = require('../../../../../../../../admin/src/utils/users.js');
var ComboboxFilter = require('../components/ComboboxFilter.js');
var getActionTypesDefaultMessages = require('./getActionTypesDefaultMessages.js');

const getDisplayedFilters = ({ formatMessage, users: users$1, canReadUsers })=>{
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
            input: ComboboxFilter.ComboboxFilter,
            label: formatMessage({
                id: 'Settings.permissions.auditLogs.action',
                defaultMessage: 'Action'
            }),
            name: 'action',
            operators,
            options: Object.keys(getActionTypesDefaultMessages.actionTypes).map((action)=>({
                    label: formatMessage({
                        id: `Settings.permissions.auditLogs.${action}`,
                        defaultMessage: getActionTypesDefaultMessages.getDefaultMessage(action)
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
    if (canReadUsers && users$1) {
        return [
            ...filters,
            {
                input: ComboboxFilter.ComboboxFilter,
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
                options: users$1.map((user)=>({
                        label: users.getDisplayName(user),
                        value: user.id.toString()
                    })),
                type: 'relation'
            }
        ];
    }
    return filters;
};

exports.getDisplayedFilters = getDisplayedFilters;
//# sourceMappingURL=getDisplayedFilters.js.map
