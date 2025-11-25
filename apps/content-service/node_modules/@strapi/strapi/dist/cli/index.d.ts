import { Command } from 'commander';
declare const createCLI: (argv: string[], command?: Command) => Promise<Command>;
declare const runCLI: (argv?: string[], command?: Command) => Promise<void>;
export { runCLI, createCLI };
//# sourceMappingURL=index.d.ts.map