type DataWithoutCondition<TData extends {
    conditions?: unknown;
}> = Omit<TData, 'conditions'>;
declare const removeConditionKeyFromData: <TData extends {
    conditions?: unknown;
}>(obj?: TData) => DataWithoutCondition<TData> | null;
export { removeConditionKeyFromData };
export type { DataWithoutCondition };
