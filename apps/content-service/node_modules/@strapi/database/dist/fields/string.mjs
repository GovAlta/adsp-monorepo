import { toString } from 'lodash/fp';
import Field from './field.mjs';

class StringField extends Field {
    toDB(value) {
        return toString(value);
    }
    fromDB(value) {
        return toString(value);
    }
}

export { StringField as default };
//# sourceMappingURL=string.mjs.map
