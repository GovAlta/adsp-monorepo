'use strict';

var _ = require('lodash');
var dates = require('date-fns');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var ___namespace = /*#__PURE__*/_interopNamespaceDefault(_);
var dates__namespace = /*#__PURE__*/_interopNamespaceDefault(dates);

const timeRegex = /^(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.[0-9]{1,3})?$/;
const isDate = (v)=>{
    return dates__namespace.isDate(v);
};
const parseTime = (value)=>{
    if (isDate(value)) {
        return dates__namespace.format(value, 'HH:mm:ss.SSS');
    }
    if (typeof value !== 'string') {
        throw new Error(`Expected a string, got a ${typeof value}`);
    }
    const result = value.match(timeRegex);
    if (result === null) {
        throw new Error('Invalid time format, expected HH:mm:ss.SSS');
    }
    const [, hours, minutes, seconds, fraction = '.000'] = result;
    const fractionPart = ___namespace.padEnd(fraction.slice(1), 3, '0');
    return `${hours}:${minutes}:${seconds}.${fractionPart}`;
};
const parseDate = (value)=>{
    if (isDate(value)) {
        return dates__namespace.format(value, 'yyyy-MM-dd');
    }
    if (typeof value !== 'string') {
        throw new Error(`Expected a string, got a ${typeof value}`);
    }
    try {
        const date = dates__namespace.parseISO(value);
        if (dates__namespace.isValid(date)) return dates__namespace.format(date, 'yyyy-MM-dd');
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
        const date = dates__namespace.parseISO(value);
        if (dates__namespace.isValid(date)) return date;
        const milliUnixDate = dates__namespace.parse(value, 'T', new Date());
        if (dates__namespace.isValid(milliUnixDate)) return milliUnixDate;
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
                return ___namespace.toNumber(value);
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

module.exports = parseType;
//# sourceMappingURL=parse-type.js.map
