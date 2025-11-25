import * as React from 'react';
import { Duration } from 'date-fns';
interface CustomInterval {
    unit: keyof Duration;
    text: string;
    threshold: number;
}
interface RelativeTimeProps extends React.ComponentPropsWithoutRef<'time'> {
    timestamp: Date;
    customIntervals?: CustomInterval[];
}
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
 */
declare const RelativeTime: React.ForwardRefExoticComponent<RelativeTimeProps & React.RefAttributes<HTMLTimeElement>>;
export { RelativeTime };
export type { CustomInterval, RelativeTimeProps };
