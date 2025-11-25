'use strict';

var _ = require('lodash');
var fp = require('lodash/fp');
var ability = require('@casl/ability');
var sanitize = require('./sanitize.js');
var validate = require('./validate.js');
var queryBuilders = require('./query-builders.js');

var index = (({ ability: ability$1, action, model })=>({
        ability: ability$1,
        action,
        model,
        get isAllowed () {
            return this.ability.can(action, model);
        },
        toSubject (target, subjectType = model) {
            return ability.subject(subjectType, target);
        },
        pickPermittedFieldsOf (data, options = {}) {
            return this.sanitizeInput(data, options);
        },
        getQuery (queryAction = action) {
            if (_.isUndefined(queryAction)) {
                throw new Error('Action must be defined to build a permission query');
            }
            return queryBuilders.buildStrapiQuery(queryBuilders.buildCaslQuery(ability$1, queryAction, model));
        },
        // eslint-disable-next-line @typescript-eslint/default-param-last
        addPermissionsQueryTo (query = {}, action) {
            const newQuery = fp.cloneDeep(query);
            const permissionQuery = this.getQuery(action) ?? undefined;
            if (fp.isPlainObject(query.filters)) {
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
        ...sanitize({
            action,
            ability: ability$1,
            model
        }),
        ...validate({
            action,
            ability: ability$1,
            model
        })
    }));

module.exports = index;
//# sourceMappingURL=index.js.map
