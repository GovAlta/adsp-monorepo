import ora from 'ora';
import * as cliProgress from 'cli-progress';
export interface LoggerOptions {
    silent?: boolean;
    debug?: boolean;
    timestamp?: boolean;
}
export interface Logger {
    warnings: number;
    errors: number;
    debug: (...args: unknown[]) => void;
    info: (...args: unknown[]) => void;
    success: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
    log: (...args: unknown[]) => void;
    spinner: (text: string) => Pick<ora.Ora, 'succeed' | 'fail' | 'start' | 'text' | 'isSpinning'>;
    progressBar: (totalSize: number, text: string) => Pick<cliProgress.SingleBar, 'start' | 'stop' | 'update'>;
}
declare const createLogger: (options?: LoggerOptions) => Logger;
export { createLogger };
//# sourceMappingURL=logger.d.ts.map