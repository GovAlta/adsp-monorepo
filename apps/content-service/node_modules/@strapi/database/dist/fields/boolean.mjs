import { toString } from 'lodash/fp';
import Field from './field.mjs';

function isStringOrNumber(value) {
    return typeof value === 'string' || typeof value === 'number';
}
class BooleanField extends Field {
    toDB(value) {
        if (typeof value === 'boolean') {
            return value;
        }
        if (isStringOrNumber(value) && [
            'true',
            't',
            '1',
            1
        ].includes(value)) {
            return true;
        }
        if (isStringOrNumber(value) && [
            'false',
            'f',
            '0',
            0
        ].includes(value)) {
            return false;
        }
        return Boolean(value);
    }
    fromDB(value) {
        if (typeof value === 'boolean') {
            return value;
        }
        const strVal = toString(value);
        if (strVal === '1') {
            return true;
        }
        if (strVal === '0') {
            return false;
        }
        return null;
    }
}

export { BooleanField as default };
//# sourceMappingURL=boolean.mjs.map
