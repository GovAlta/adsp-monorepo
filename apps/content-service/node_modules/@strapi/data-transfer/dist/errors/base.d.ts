import { Severity } from './constants';
declare class DataTransferError<T = unknown> extends Error {
    origin: string;
    severity: Severity;
    details: T | null;
    constructor(origin: string, severity: Severity, message?: string, details?: T | null);
}
export { DataTransferError };
//# sourceMappingURL=base.d.ts.map