export type Env = typeof envFn & typeof utils;
declare function envFn<T>(key: string, defaultValue?: T): string | T | undefined;
declare const utils: {
    int(key: string, defaultValue?: number): number | undefined;
    float(key: string, defaultValue?: number): number | undefined;
    bool(key: string, defaultValue?: boolean): boolean | undefined;
    json(key: string, defaultValue?: object): any;
    array(key: string, defaultValue?: string[]): string[] | undefined;
    date(key: string, defaultValue?: Date): Date | undefined;
    /**
     * Gets a value from env that matches oneOf provided values
     * @param {string} key
     * @param {string[]} expectedValues
     * @param {string|undefined} defaultValue
     * @returns {string|undefined}
     */
    oneOf(key: string, expectedValues?: unknown[], defaultValue?: unknown): unknown;
};
declare const env: Env;
export default env;
//# sourceMappingURL=env-helper.d.ts.map