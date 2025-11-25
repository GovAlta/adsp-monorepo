import * as sift from 'sift';
import qs from 'qs';
import { AbilityBuilder, Ability } from '@casl/ability';
import { pick, isNil, isObject } from 'lodash/fp';

const allowedOperations = [
    '$or',
    '$and',
    '$eq',
    '$ne',
    '$in',
    '$nin',
    '$lt',
    '$lte',
    '$gt',
    '$gte',
    '$exists',
    '$elemMatch'
];
const operations = pick(allowedOperations, sift);
const conditionsMatcher = (conditions)=>{
    return sift.createQueryTester(conditions, {
        operations
    });
};
const buildParametrizedAction = ({ name, params })=>{
    return `${name}?${qs.stringify(params)}`;
};
/**
 * Casl Ability Builder.
 */ const caslAbilityBuilder = ()=>{
    const { can, build, ...rest } = new AbilityBuilder(Ability);
    return {
        can (permission) {
            const { action, subject, properties = {}, condition } = permission;
            const { fields } = properties;
            const caslAction = typeof action === 'string' ? action : buildParametrizedAction(action);
            return can(caslAction, isNil(subject) ? 'all' : subject, fields, isObject(condition) ? condition : undefined);
        },
        buildParametrizedAction ({ name, params }) {
            return `${name}?${qs.stringify(params)}`;
        },
        build () {
            const ability = build({
                conditionsMatcher
            });
            function decorateCan(originalCan) {
                return function(...args) {
                    const [action, ...rest] = args;
                    const caslAction = typeof action === 'string' ? action : buildParametrizedAction(action);
                    // Call the original `can` method
                    return originalCan.apply(ability, [
                        caslAction,
                        ...rest
                    ]);
                };
            }
            ability.can = decorateCan(ability.can);
            return ability;
        },
        ...rest
    };
};

export { caslAbilityBuilder };
//# sourceMappingURL=casl-ability.mjs.map
