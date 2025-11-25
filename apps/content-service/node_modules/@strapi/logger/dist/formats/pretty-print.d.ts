import { Logform } from 'winston';
export interface PrettyPrintOptions {
    /**
     * Enable or disable timestamps print if it's a boolean value. Use the given format for the timestamps if it's a string
     */
    timestamps?: Logform.TimestampOptions['format'] | boolean;
    /**
     * Enable or disable the use of colors for the log level
     */
    colors?: boolean;
}
/**
 * Create a pretty print formatter for a winston logger
 * @param options
 */
declare const _default: (options?: PrettyPrintOptions) => Logform.Format;
export default _default;
//# sourceMappingURL=pretty-print.d.ts.map