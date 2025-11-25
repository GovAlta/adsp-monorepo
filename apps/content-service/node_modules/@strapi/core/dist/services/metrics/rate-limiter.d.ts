import type { Sender } from './sender';
interface Options {
    limitedEvents?: string[];
}
declare const _default: (sender: Sender, { limitedEvents }?: Options) => (event: string, payload?: import("./sender").Payload | undefined, opts?: Record<string, unknown> | undefined) => Promise<boolean>;
export default _default;
//# sourceMappingURL=rate-limiter.d.ts.map