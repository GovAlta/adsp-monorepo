import { AsyncSeriesHook, AsyncParallelHook } from './hooks';
export interface ProviderHooksMap {
    willRegister: AsyncSeriesHook;
    didRegister: AsyncParallelHook;
    willDelete: AsyncParallelHook;
    didDelete: AsyncParallelHook;
}
export interface Options {
    throwOnDuplicates?: boolean;
}
type Item = Record<string, unknown>;
export interface Provider<T = unknown> {
    hooks: ProviderHooksMap;
    register(key: string, item: T): Promise<Provider>;
    delete(key: string): Promise<Provider>;
    get(key: string): T | undefined;
    values(): T[];
    keys(): string[];
    has(key: string): boolean;
    size(): number;
    clear(): Promise<Provider<T>>;
}
export type ProviderFactory<T> = (options?: Options) => Provider<T>;
/**
 * A Provider factory
 */
declare const providerFactory: <T = Item>(options?: Options) => Provider<T>;
export default providerFactory;
//# sourceMappingURL=provider-factory.d.ts.map