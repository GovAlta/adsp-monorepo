import _ from 'lodash/fp';

const PERMISSION_FIELDS = [
    'action',
    'subject',
    'properties',
    'conditions'
];
const sanitizePermissionFields = _.pick(PERMISSION_FIELDS);
/**
 * Creates a permission with default values for optional properties
 */ const getDefaultPermission = ()=>({
        conditions: [],
        properties: {},
        subject: null
    });
/**
 * Create a new permission based on given attributes
 *
 * @param {object} attributes
 */ const create = _.pipe(_.pick(PERMISSION_FIELDS), _.merge(getDefaultPermission()));
/**
 * Add a condition to a permission
 */ const addCondition = _.curry((condition, permission)=>{
    const { conditions } = permission;
    const newConditions = Array.isArray(conditions) ? _.uniq(conditions.concat(condition)) : [
        condition
    ];
    return _.set('conditions', newConditions, permission);
});
/**
 * Gets a property or a part of a property from a permission.
 */ const getProperty = _.curry((property, permission)=>_.get(`properties.${property}`, permission));

export { addCondition, create, getProperty, sanitizePermissionFields };
//# sourceMappingURL=index.mjs.map
