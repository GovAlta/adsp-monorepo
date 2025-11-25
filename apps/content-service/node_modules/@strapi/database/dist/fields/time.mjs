import { parseTime } from './shared/parsers.mjs';
import Field from './field.mjs';

class TimeField extends Field {
    toDB(value) {
        return parseTime(value);
    }
    fromDB(value) {
        // make sure that's a string with valid format ?
        return value;
    }
}

export { TimeField as default };
//# sourceMappingURL=time.mjs.map
