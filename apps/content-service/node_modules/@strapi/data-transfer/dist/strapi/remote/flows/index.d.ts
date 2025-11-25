import type { TransferStage } from '../../../../types';
export type Step = {
    kind: 'action';
    action: string;
} | {
    kind: 'transfer';
    stage: TransferStage;
    locked?: boolean;
};
export { default as DEFAULT_TRANSFER_FLOW } from './default';
export interface TransferFlow {
    has(step: Step): boolean;
    can(step: Step): boolean;
    cannot(step: Step): boolean;
    set(step: Step): this;
    get(): Step | null;
}
export declare const createFlow: (flow: readonly Step[]) => TransferFlow;
//# sourceMappingURL=index.d.ts.map