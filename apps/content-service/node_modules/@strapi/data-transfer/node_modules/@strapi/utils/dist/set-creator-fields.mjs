import { assoc, assign } from 'lodash/fp';
import { constants } from './content-types.mjs';

const { CREATED_BY_ATTRIBUTE, UPDATED_BY_ATTRIBUTE } = constants;
const setCreatorFields = ({ user, isEdition = false })=>(data)=>{
        if (isEdition) {
            return assoc(UPDATED_BY_ATTRIBUTE, user.id, data);
        }
        return assign(data, {
            [CREATED_BY_ATTRIBUTE]: user.id,
            [UPDATED_BY_ATTRIBUTE]: user.id
        });
    };

export { setCreatorFields as default };
//# sourceMappingURL=set-creator-fields.mjs.map
