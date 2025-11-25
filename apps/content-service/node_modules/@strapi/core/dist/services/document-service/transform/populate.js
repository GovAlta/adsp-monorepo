'use strict';

var strapiUtils = require('@strapi/utils');
var fields = require('./fields.js');

const transformPopulate = async (data, opts)=>{
    return strapiUtils.traverse.traverseQueryPopulate(async ({ attribute, key, value }, { set })=>{
        if (!value || typeof value !== 'object' || attribute?.type !== 'relation') {
            return;
        }
        /*
        If the attribute is a relation
        Look for fields in the value
        and apply the relevant transformation to these objects
      */ if ('fields' in value && Array.isArray(value.fields)) {
            value.fields = fields.transformFields(value.fields);
        }
        set(key, value);
    }, {
        schema: strapi.getModel(opts.uid),
        getModel: strapi.getModel.bind(strapi)
    }, data);
};

exports.transformPopulate = transformPopulate;
//# sourceMappingURL=populate.js.map
