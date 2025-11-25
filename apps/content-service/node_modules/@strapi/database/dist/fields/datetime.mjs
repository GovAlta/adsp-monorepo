import * as dateFns from 'date-fns';
import { parseDateTimeOrTimestamp } from './shared/parsers.mjs';
import Field from './field.mjs';

class DatetimeField extends Field {
    toDB(value) {
        return parseDateTimeOrTimestamp(value);
    }
    fromDB(value) {
        const cast = new Date(value);
        return dateFns.isValid(cast) ? cast.toISOString() : null;
    }
}

export { DatetimeField as default };
//# sourceMappingURL=datetime.mjs.map
