'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

// TODO: TS User and role type
const conditions = [
    {
        displayName: 'Is creator',
        name: 'is-creator',
        plugin: 'admin',
        handler: (user)=>({
                'createdBy.id': user.id
            })
    },
    {
        displayName: 'Has same role as creator',
        name: 'has-same-role-as-creator',
        plugin: 'admin',
        handler: (user)=>({
                'createdBy.roles': {
                    $elemMatch: {
                        id: {
                            $in: user.roles.map((r)=>r.id)
                        }
                    }
                }
            })
    }
];
var adminConditions = {
    conditions
};

exports.conditions = conditions;
exports.default = adminConditions;
//# sourceMappingURL=admin-conditions.js.map
