import * as React from 'react';
export declare const useSelectionState: <TValues extends object>(keys: Array<keyof TValues>, initialValue: TValues[]) => readonly [TValues[], {
    readonly selectOne: (selection: TValues) => void;
    readonly selectAll: (nextSelections?: TValues[]) => void;
    readonly selectOnly: (nextSelection: TValues) => void;
    readonly selectMultiple: (nextSelections: TValues[]) => void;
    readonly deselectMultiple: (nextSelections: TValues[]) => void;
    readonly setSelections: React.Dispatch<React.SetStateAction<TValues[]>>;
}];
