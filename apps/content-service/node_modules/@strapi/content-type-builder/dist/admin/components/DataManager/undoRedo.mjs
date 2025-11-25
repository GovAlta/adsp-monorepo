import { original, createSlice } from '@reduxjs/toolkit';

const isCallable = (obj)=>{
    return typeof obj === 'function';
};
const createUndoRedoSlice = (sliceOpts, opts)=>{
    const initialState = {
        past: [],
        future: [],
        current: isCallable(sliceOpts.initialState) ? sliceOpts.initialState() : sliceOpts.initialState
    };
    const { limit = 10 } = opts ?? {};
    const selector = opts.stateSelector || ((state)=>state);
    const wrappedReducers = Object.keys(sliceOpts.reducers).reduce((acc, actionName)=>{
        const reducer = sliceOpts.reducers[actionName];
        if (!isCallable(reducer)) {
            throw new Error('Reducer must be a function. prepapre not support in UndoRedo wrapper');
        }
        acc[actionName] = (state, action)=>{
            const newCurrent = reducer(state.current, action);
            if (opts.excludeActionsFromHistory?.includes(actionName)) {
                if (newCurrent !== undefined) {
                    state.current = newCurrent;
                }
                return;
            }
            const originalCurrent = original(state.current);
            state.past.push(selector(originalCurrent));
            if (state.past.length > limit) {
                state.past.shift();
            }
            state.future = [];
            if (newCurrent !== undefined) {
                state.current = newCurrent;
            }
        };
        return acc;
    }, {});
    return createSlice({
        name: sliceOpts.name,
        initialState,
        // @ts-expect-error - TS doesn't like the fact that we're adding extra reducers
        reducers: {
            ...wrappedReducers,
            undo: (state)=>{
                if (state.past.length === 0) {
                    return;
                }
                const previous = state.past.pop();
                if (previous !== undefined) {
                    state.future = [
                        state.current,
                        ...state.future
                    ];
                    // reapply the previous state partially
                    // @ts-expect-error - TS doesn't like the fact that we're mutating the state
                    state.current = {
                        ...state.current,
                        ...previous
                    };
                }
            },
            redo: (state)=>{
                if (state.future.length === 0) {
                    return;
                }
                const next = state.future.shift();
                if (next != undefined) {
                    state.past = [
                        ...state.past,
                        state.current
                    ];
                    // reapply the previous state partially
                    // @ts-expect-error - TS doesn't like the fact that we're mutating the state
                    state.current = {
                        ...state.current,
                        ...next
                    };
                }
            },
            discardAll: (state)=>{
                if (opts.discard) {
                    opts.discard(state.current);
                } else {
                    // @ts-expect-error - TS doesn't like the fact that we're mutating the state
                    state.current = initialState.current;
                }
                state.past = [];
                state.future = [];
            },
            clearHistory: (state)=>{
                state.past = [];
                state.future = [];
            }
        }
    });
};

export { createUndoRedoSlice };
//# sourceMappingURL=undoRedo.mjs.map
