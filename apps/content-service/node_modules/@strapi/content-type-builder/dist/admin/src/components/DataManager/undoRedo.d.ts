import { CaseReducer, CreateSliceOptions, Draft, SliceCaseReducers } from '@reduxjs/toolkit';
export type UndoRedoState<T> = {
    past: Array<Partial<T>>;
    future: Array<Partial<T>>;
    current: T;
};
type WrappedUndoRedoReducer<TState, TReducers extends SliceCaseReducers<TState>> = {
    [K in keyof TReducers]: TReducers[K] extends CaseReducer<TState, infer A> ? CaseReducer<UndoRedoState<TState>, A> : never;
};
type UndoRedoReducer<TState, TReducers extends SliceCaseReducers<TState>> = WrappedUndoRedoReducer<TState, TReducers> & {
    undo: CaseReducer<UndoRedoState<TState>>;
    redo: CaseReducer<UndoRedoState<TState>>;
    discardAll: CaseReducer<UndoRedoState<TState>>;
    clearHistory: CaseReducer<UndoRedoState<TState>>;
};
type Opts<TState> = {
    limit?: number;
    excludeActionsFromHistory?: string[];
    stateSelector?: (state: Draft<TState> | undefined) => Draft<Partial<TState>>;
    discard?: (state: Draft<TState>) => void;
};
export declare const createUndoRedoSlice: <State, CaseReducers extends SliceCaseReducers<State>>(sliceOpts: CreateSliceOptions<State, CaseReducers, string>, opts: Opts<State>) => import("@reduxjs/toolkit").Slice<UndoRedoState<State>, UndoRedoReducer<State, CaseReducers>, string>;
export {};
