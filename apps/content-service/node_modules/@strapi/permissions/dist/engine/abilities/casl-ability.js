'use strict';

var sift = require('sift');
var qs = require('qs');
var ability = require('@casl/ability');
var _ = require('lodash/fp');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var sift__namespace = /*#__PURE__*/_interopNamespaceDefault(sift);

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
const operations = _.pick(allowedOperations, sift__namespace);
const conditionsMatcher = (conditions)=>{
    return sift__namespace.createQueryTester(conditions, {
        operations
    });
};
const buildParametrizedAction = ({ name, params })=>{
    return `${name}?${qs.stringify(params)}`;
};
/**
 * Casl Ability Builder.
 */ const caslAbilityBuilder = ()=>{
    const { can, build, ...rest } = new ability.AbilityBuilder(ability.Ability);
    return {
        can (permission) {
            const { action, subject, properties = {}, condition } = permission;
            const { fields } = properties;
            const caslAction = typeof action === 'string' ? action : buildParametrizedAction(action);
            return can(caslAction, _.isNil(subject) ? 'all' : subject, fields, _.isObject(condition) ? condition : undefined);
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

exports.caslAbilityBuilder = caslAbilityBuilder;
//# sourceMappingURL=casl-ability.js.map
