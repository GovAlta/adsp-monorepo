'use strict';

const createCustomFields = (strapi)=>{
    return {
        register (customField) {
            strapi.get('custom-fields').add(customField);
        }
    };
};

module.exports = createCustomFields;
//# sourceMappingURL=custom-fields.js.map
