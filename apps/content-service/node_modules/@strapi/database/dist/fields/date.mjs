import { parseDate } from './shared/parsers.mjs';
import Field from './field.mjs';

class DateField extends Field {
    toDB(value) {
        return parseDate(value);
    }
    fromDB(value) {
        return value;
    }
}

export { DateField as default };
//# sourceMappingURL=date.mjs.map
