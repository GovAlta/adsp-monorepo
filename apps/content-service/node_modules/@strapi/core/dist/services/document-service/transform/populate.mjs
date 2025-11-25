import { traverse } from '@strapi/utils';
import { transformFields } from './fields.mjs';

const transformPopulate = async (data, opts)=>{
    return traverse.traverseQueryPopulate(async ({ attribute, key, value }, { set })=>{
        if (!value || typeof value !== 'object' || attribute?.type !== 'relation') {
            return;
        }
        /*
        If the attribute is a relation
        Look for fields in the value
        and apply the relevant transformation to these objects
      */ if ('fields' in value && Array.isArray(value.fields)) {
            value.fields = transformFields(value.fields);
        }
        set(key, value);
    }, {
        schema: strapi.getModel(opts.uid),
        getModel: strapi.getModel.bind(strapi)
    }, data);
};

export { transformPopulate };
//# sourceMappingURL=populate.mjs.map
