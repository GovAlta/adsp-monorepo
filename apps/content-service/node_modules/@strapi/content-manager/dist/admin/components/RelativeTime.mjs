import { jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { intervalToDuration, isPast } from 'date-fns';
import { useIntl } from 'react-intl';

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
 */ const RelativeTime = /*#__PURE__*/ React.forwardRef(({ timestamp, customIntervals = [], ...restProps }, forwardedRef)=>{
    const { formatRelativeTime, formatDate, formatTime } = useIntl();
    /**
     * TODO: make this auto-update, like a clock.
     */ const interval = intervalToDuration({
        start: timestamp,
        end: Date.now()
    });
    const unit = intervals.find((intervalUnit)=>{
        return interval[intervalUnit] > 0 && Object.keys(interval).includes(intervalUnit);
    }) ?? 'seconds';
    const relativeTime = isPast(timestamp) ? -interval[unit] : interval[unit];
    // Display custom text if interval is less than the threshold
    const customInterval = customIntervals.find((custom)=>interval[custom.unit] < custom.threshold);
    const displayText = customInterval ? customInterval.text : formatRelativeTime(relativeTime, unit, {
        numeric: 'auto'
    });
    return /*#__PURE__*/ jsx("time", {
        ref: forwardedRef,
        dateTime: timestamp.toISOString(),
        role: "time",
        title: `${formatDate(timestamp)} ${formatTime(timestamp)}`,
        ...restProps,
        children: displayText
    });
});

export { RelativeTime };
//# sourceMappingURL=RelativeTime.mjs.map
