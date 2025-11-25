import { curry } from 'lodash/fp';
import transforms from './transforms.mjs';

const applyTransforms = curry((schema, data)=>{
    const attributeNames = Object.keys(data);
    for (const attributeName of attributeNames){
        const value = data[attributeName];
        const attribute = schema.attributes[attributeName];
        if (!attribute) {
            continue;
        }
        const transform = transforms[attribute.type];
        if (transform) {
            const attributeContext = {
                attributeName,
                attribute
            };
            data[attributeName] = transform(value, attributeContext);
        }
    }
    return data;
});

export { applyTransforms };
//# sourceMappingURL=index.mjs.map
