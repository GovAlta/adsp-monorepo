import { DateFormatter } from '@internationalized/date';
export interface DateFormatterOptions extends Intl.DateTimeFormatOptions {
    calendar?: string;
}
/**
 * This hook wraps the `DateFormatter` from `@internationalized/date`. Which essentially is
 * an extension of the `Intl.DateTimeFormat` API with some additional features.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat
 * for more information.
 *
 * @returns a memoized DateFormatter instance
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *  const monthFormatter = useDateFormatter(locale, { month: 'long' });
 *  const months: string[] = React.useMemo(
 *    () => [...Array(12).keys()].map((m) => monthFormatter.format(new Date(Date.UTC(2023, m)))),
 *    [monthFormatter],
 *   );
 *
 *  // assuming the locale is `en-GB` this will render `Janyary` to `December`.
 *  return months.map((month) => <p key={month}>{month}</p>)
 * }
 * ```
 */
export declare function useDateFormatter(locale: string, options?: DateFormatterOptions): DateFormatter;
//# sourceMappingURL=useDateFormatter.d.ts.map