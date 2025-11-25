export declare const runCLI: () => Promise<void>;
type GenerateOptions = {
    dir?: string;
    plopFile?: string;
};
export declare const generate: <T extends Record<string, any>>(generatorName: string, options: T, { dir, plopFile }?: GenerateOptions) => Promise<{
    success: boolean;
}>;
export {};
//# sourceMappingURL=index.d.ts.map