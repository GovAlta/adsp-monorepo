'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var dateFns = require('date-fns');
var reactIntl = require('react-intl');

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

var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);

const intervals = [
    'years',
    'months',
    'days',
    'hours',
    'minutes',
    'seconds'
];
/**
 * Displays the relative time between a given timestamp and the current time.
 * You can display a custom message for given time intervals by passing an array of custom intervals.
 *
 * @example
 * ```jsx
 * <caption>Display "last hour" if the timestamp is less than an hour ago</caption>
 * <RelativeTime
 *  timestamp={new Date('2021-01-01')}
 *  customIntervals={[
 *   { unit: 'hours', threshold: 1, text: 'last hour' },
 *  ]}
 * ```
 */ const RelativeTime = /*#__PURE__*/ React__namespace.forwardRef(({ timestamp, customIntervals = [], ...restProps }, forwardedRef)=>{
    const { formatRelativeTime, formatDate, formatTime } = reactIntl.useIntl();
    /**
     * TODO: make this auto-update, like a clock.
     */ const interval = dateFns.intervalToDuration({
        start: timestamp,
        end: Date.now()
    });
    const unit = intervals.find((intervalUnit)=>{
        return interval[intervalUnit] > 0 && Object.keys(interval).includes(intervalUnit);
    }) ?? 'seconds';
    const relativeTime = dateFns.isPast(timestamp) ? -interval[unit] : interval[unit];
    // Display custom text if interval is less than the threshold
    const customInterval = customIntervals.find((custom)=>interval[custom.unit] < custom.threshold);
    const displayText = customInterval ? customInterval.text : formatRelativeTime(relativeTime, unit, {
        numeric: 'auto'
    });
    return /*#__PURE__*/ jsxRuntime.jsx("time", {
        ref: forwardedRef,
        dateTime: timestamp.toISOString(),
        role: "time",
        title: `${formatDate(timestamp)} ${formatTime(timestamp)}`,
        ...restProps,
        children: displayText
    });
});

exports.RelativeTime = RelativeTime;
//# sourceMappingURL=RelativeTime.js.map
