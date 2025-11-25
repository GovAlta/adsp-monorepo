import type { BuildContext } from '../create-build-context';
interface ViteWatcher {
    close(): Promise<void>;
}
declare const watch: (ctx: BuildContext) => Promise<ViteWatcher>;
export { watch };
export type { ViteWatcher };
//# sourceMappingURL=watch.d.ts.map