interface Options {
    name: string;
    validator?(config: unknown): void;
    handler(...args: any[]): any;
}
declare const createPolicy: (options: Options) => {
    name: string;
    validator: (config: unknown) => void;
    handler: (...args: any[]) => any;
};
declare const createPolicyContext: (type: string, ctx: object) => {
    is: import("lodash/fp").LodashEq1x1;
    readonly type: string;
} & object;
export { createPolicy, createPolicyContext };
//# sourceMappingURL=policy.d.ts.map