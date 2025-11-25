import * as _ from 'lodash';
import * as dates from 'date-fns';

const timeRegex = /^(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.[0-9]{1,3})?$/;
const isDate = (v)=>{
    return dates.isDate(v);
};
const parseTime = (value)=>{
    if (isDate(value)) {
        return dates.format(value, 'HH:mm:ss.SSS');
    }
    if (typeof value !== 'string') {
        throw new Error(`Expected a string, got a ${typeof value}`);
    }
    const result = value.match(timeRegex);
    if (result === null) {
        throw new Error('Invalid time format, expected HH:mm:ss.SSS');
    }
    const [, hours, minutes, seconds, fraction = '.000'] = result;
    const fractionPart = _.padEnd(fraction.slice(1), 3, '0');
    return `${hours}:${minutes}:${seconds}.${fractionPart}`;
};
const parseDate = (value)=>{
    if (isDate(value)) {
        return dates.format(value, 'yyyy-MM-dd');
    }
    if (typeof value !== 'string') {
        throw new Error(`Expected a string, got a ${typeof value}`);
    }
    try {
        const date = dates.parseISO(value);
        if (dates.isValid(date)) return dates.format(date, 'yyyy-MM-dd');
        throw new Error(`Invalid format, expected an ISO compatible date`);
    } catch (error) {
        throw new Error(`Invalid format, expected an ISO compatible date`);
    }
};
const parseDateTimeOrTimestamp = (value)=>{
    if (isDate(value)) {
        return value;
    }
    if (typeof value !== 'string') {
        throw new Error(`Expected a string, got a ${typeof value}`);
    }
    try {
        const date = dates.parseISO(value);
        if (dates.isValid(date)) return date;
        const milliUnixDate = dates.parse(value, 'T', new Date());
        if (dates.isValid(milliUnixDate)) return milliUnixDate;
        throw new Error(`Invalid format, expected a timestamp or an ISO date`);
    } catch (error) {
        throw new Error(`Invalid format, expected a timestamp or an ISO date`);
    }
};
const parseBoolean = (value, options)=>{
    const { forceCast = false } = options;
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string' || typeof value === 'number') {
        if ([
            'true',
            't',
            '1',
            1
        ].includes(value)) {
            return true;
        }
        if ([
            'false',
            'f',
            '0',
            0
        ].includes(value)) {
            return false;
        }
    }
    if (forceCast) {
        return Boolean(value);
    }
    throw new Error('Invalid boolean input. Expected "t","1","true","false","0","f"');
};
/**
 * Cast basic values based on attribute type
 */ const parseType = (options)=>{
    const { type, value, forceCast } = options;
    switch(type){
        case 'boolean':
            return parseBoolean(value, {
                forceCast
            });
        case 'integer':
        case 'biginteger':
        case 'float':
        case 'decimal':
            {
                return _.toNumber(value);
            }
        case 'time':
            {
                return parseTime(value);
            }
        case 'date':
            {
                return parseDate(value);
            }
        case 'timestamp':
        case 'datetime':
            {
                return parseDateTimeOrTimestamp(value);
            }
        default:
            return value;
    }
};

export { parseType as default };
//# sourceMappingURL=parse-type.mjs.map
