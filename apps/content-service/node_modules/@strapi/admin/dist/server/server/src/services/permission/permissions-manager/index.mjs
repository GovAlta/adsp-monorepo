import ___default from 'lodash';
import { cloneDeep, isPlainObject } from 'lodash/fp';
import { subject } from '@casl/ability';
import createSanitizeHelpers from './sanitize.mjs';
import createValidateHelpers from './validate.mjs';
import { buildStrapiQuery, buildCaslQuery } from './query-builders.mjs';

var index = (({ ability, action, model })=>({
        ability,
        action,
        model,
        get isAllowed () {
            return this.ability.can(action, model);
        },
        toSubject (target, subjectType = model) {
            return subject(subjectType, target);
        },
        pickPermittedFieldsOf (data, options = {}) {
            return this.sanitizeInput(data, options);
        },
        getQuery (queryAction = action) {
            if (___default.isUndefined(queryAction)) {
                throw new Error('Action must be defined to build a permission query');
            }
            return buildStrapiQuery(buildCaslQuery(ability, queryAction, model));
        },
        // eslint-disable-next-line @typescript-eslint/default-param-last
        addPermissionsQueryTo (query = {}, action) {
            const newQuery = cloneDeep(query);
            const permissionQuery = this.getQuery(action) ?? undefined;
            if (isPlainObject(query.filters)) {
                newQuery.filters = permissionQuery ? {
                    $and: [
                        query.filters,
                        permissionQuery
                    ]
                } : query.filters;
            } else {
                newQuery.filters = permissionQuery;
            }
            return newQuery;
        },
        ...createSanitizeHelpers({
            action,
            ability,
            model
        }),
        ...createValidateHelpers({
            action,
            ability,
            model
        })
    }));

export { index as default };
//# sourceMappingURL=index.mjs.map
