import type { BuildContext } from '../create-build-context';
interface WebpackWatcher {
    close(): Promise<void>;
}
declare const watch: (ctx: BuildContext) => Promise<WebpackWatcher>;
export { watch };
export type { WebpackWatcher };
//# sourceMappingURL=watch.d.ts.map