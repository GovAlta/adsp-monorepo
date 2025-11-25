interface Options {
    appDir?: string;
    ignoreDiagnostics?: boolean;
}
export default function compile(options?: Options): Promise<{
    appDir: string;
    distDir: any;
}>;
export {};
//# sourceMappingURL=compile.d.ts.map