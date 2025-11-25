import * as dateFns from 'date-fns';
import { parseDateTimeOrTimestamp } from './shared/parsers.mjs';
import Field from './field.mjs';

class TimestampField extends Field {
    toDB(value) {
        return parseDateTimeOrTimestamp(value);
    }
    fromDB(value) {
        const cast = new Date(value);
        return dateFns.isValid(cast) ? dateFns.format(cast, 'T') : null;
    }
}

export { TimestampField as default };
//# sourceMappingURL=timestamp.mjs.map
