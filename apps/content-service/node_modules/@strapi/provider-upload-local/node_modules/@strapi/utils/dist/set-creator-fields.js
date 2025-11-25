'use strict';

var fp = require('lodash/fp');
var contentTypes = require('./content-types.js');

const { CREATED_BY_ATTRIBUTE, UPDATED_BY_ATTRIBUTE } = contentTypes.constants;
const setCreatorFields = ({ user, isEdition = false })=>(data)=>{
        if (isEdition) {
            return fp.assoc(UPDATED_BY_ATTRIBUTE, user.id, data);
        }
        return fp.assign(data, {
            [CREATED_BY_ATTRIBUTE]: user.id,
            [UPDATED_BY_ATTRIBUTE]: user.id
        });
    };

module.exports = setCreatorFields;
//# sourceMappingURL=set-creator-fields.js.map
