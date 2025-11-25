export interface IDiagnosticReporterOptions {
    stackSize?: number;
}
export type GenericDiagnostic<K extends DiagnosticKind, T = unknown> = {
    kind: K;
    details: {
        message: string;
        createdAt: Date;
    } & T;
};
export type DiagnosticKind = 'error' | 'warning' | 'info';
export type DiagnosticListener<T extends DiagnosticKind = DiagnosticKind> = (diagnostic: {
    kind: T;
} & Diagnostic extends infer U ? U : never) => void | Promise<void>;
export type DiagnosticEvent = 'diagnostic' | `diagnostic.${DiagnosticKind}`;
export type GetEventListener<E extends DiagnosticEvent> = E extends 'diagnostic' ? DiagnosticListener : E extends `diagnostic.${infer K}` ? K extends DiagnosticKind ? DiagnosticListener<K> : never : never;
export type Diagnostic = ErrorDiagnostic | WarningDiagnostic | InfoDiagnostic;
export type ErrorDiagnosticSeverity = 'fatal' | 'error' | 'silly';
export type ErrorDiagnostic = GenericDiagnostic<'error', {
    name: string;
    severity: ErrorDiagnosticSeverity;
    error: Error;
}>;
export type WarningDiagnostic = GenericDiagnostic<'warning', {
    origin?: string;
}>;
export type InfoDiagnostic<T = unknown> = GenericDiagnostic<'info', {
    origin?: string;
    params?: T;
}>;
export interface IDiagnosticReporter {
    stack: {
        readonly size: number;
        readonly items: Diagnostic[];
    };
    report(diagnostic: Diagnostic): IDiagnosticReporter;
    onDiagnostic(listener: DiagnosticListener): IDiagnosticReporter;
    on<T extends DiagnosticKind>(kind: T, listener: DiagnosticListener<T>): IDiagnosticReporter;
}
declare const createDiagnosticReporter: (options?: IDiagnosticReporterOptions) => IDiagnosticReporter;
export { createDiagnosticReporter };
//# sourceMappingURL=diagnostic.d.ts.map