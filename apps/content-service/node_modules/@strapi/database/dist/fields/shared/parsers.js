'use strict';

var _ = require('lodash/fp');
var dateFns = require('date-fns');
var invalidTime = require('../../errors/invalid-time.js');
var invalidDate = require('../../errors/invalid-date.js');
var invalidDatetime = require('../../errors/invalid-datetime.js');

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

var dateFns__namespace = /*#__PURE__*/_interopNamespaceDefault(dateFns);

const isDate = (value)=>{
    return dateFns__namespace.isDate(value);
};
const DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
const PARTIAL_DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])/g;
const TIME_REGEX = /^(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.[0-9]{1,3})?$/;
const parseDateTimeOrTimestamp = (value)=>{
    if (isDate(value)) {
        return value;
    }
    try {
        const date = dateFns__namespace.parseISO(_.toString(value));
        if (dateFns__namespace.isValid(date)) {
            return date;
        }
        const milliUnixDate = dateFns__namespace.parse(_.toString(value), 'T', new Date());
        if (dateFns__namespace.isValid(milliUnixDate)) {
            return milliUnixDate;
        }
        throw new invalidDatetime(`Invalid format, expected a timestamp or an ISO date`);
    } catch (error) {
        throw new invalidDatetime(`Invalid format, expected a timestamp or an ISO date`);
    }
};
const parseDate = (value)=>{
    if (isDate(value)) {
        return dateFns__namespace.format(value, 'yyyy-MM-dd');
    }
    const found = _.isString(value) ? value.match(PARTIAL_DATE_REGEX) || [] : [];
    const extractedValue = found[0];
    if (extractedValue && !DATE_REGEX.test(_.toString(value))) {
        // TODO V5: throw an error when format yyyy-MM-dd is not respected
        // throw new InvalidDateError(`Invalid format, expected yyyy-MM-dd`);
        process.emitWarning(`[deprecated] Using a date format other than YYYY-MM-DD will be removed in future versions. Date received: ${value}. Date stored: ${extractedValue}.`);
    }
    if (!extractedValue) {
        throw new invalidDate(`Invalid format, expected yyyy-MM-dd`);
    }
    const date = dateFns__namespace.parseISO(extractedValue);
    if (!dateFns__namespace.isValid(date)) {
        throw new invalidDate(`Invalid date`);
    }
    return extractedValue;
};
const parseTime = (value)=>{
    if (isDate(value)) {
        return dateFns__namespace.format(value, 'HH:mm:ss.SSS');
    }
    if (typeof value !== 'string') {
        throw new invalidTime(`Expected a string, got a ${typeof value}`);
    }
    const result = value.match(TIME_REGEX);
    if (result === null) {
        throw new invalidTime('Invalid time format, expected HH:mm:ss.SSS');
    }
    const [, hours, minutes, seconds, fraction = '.000'] = result;
    const fractionPart = _.padCharsEnd('0', 3, fraction.slice(1));
    return `${hours}:${minutes}:${seconds}.${fractionPart}`;
};

exports.parseDate = parseDate;
exports.parseDateTimeOrTimestamp = parseDateTimeOrTimestamp;
exports.parseTime = parseTime;
//# sourceMappingURL=parsers.js.map
