interface RecursiveRecordOfBooleans extends Record<string, boolean | RecursiveRecordOfBooleans> {
}
declare const getCheckboxState: (dataObj: RecursiveRecordOfBooleans) => {
    hasAllActionsSelected: boolean;
    hasSomeActionsSelected: boolean;
};
export { getCheckboxState };
export type { RecursiveRecordOfBooleans };
