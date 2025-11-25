export interface Container {
    add<T, U extends string>(name: U, resolver: T): Container;
    get<T = any>(name: string, args?: unknown): T;
}
//# sourceMappingURL=container.d.ts.map