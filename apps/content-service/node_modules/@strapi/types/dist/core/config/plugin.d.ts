export interface Plugin {
    [key: string]: {
        enabled: boolean;
        resolve?: string;
        config?: object;
    } | boolean;
}
//# sourceMappingURL=plugin.d.ts.map