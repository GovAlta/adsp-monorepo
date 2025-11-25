import { toNumber } from 'lodash/fp';
import Field from './field.mjs';

class NumberField extends Field {
    toDB(value) {
        const numberValue = toNumber(value);
        if (Number.isNaN(numberValue)) {
            throw new Error(`Expected a valid Number, got ${value}`);
        }
        return numberValue;
    }
    fromDB(value) {
        return toNumber(value);
    }
}

export { NumberField as default };
//# sourceMappingURL=number.mjs.map
