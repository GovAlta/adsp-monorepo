/**
 * Simulate an interval by shifting a cron expression using the specified date.
 * @param {string} rule A cron expression you want to shift.
 * @param {Date} date The date that's gonna be used as the start of the "interval", it defaults to now.
 * @returns The shifted cron expression.
 */
export declare const shiftCronExpression: (rule: string, date?: Date) => string;
//# sourceMappingURL=cron.d.ts.map