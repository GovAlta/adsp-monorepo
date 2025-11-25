declare const reducer: import("redux").Reducer<import("redux").CombinedState<{
    app: import("./app").AppState;
}>, import("redux").AnyAction>;
type State = ReturnType<typeof reducer>;
export { reducer };
export type { State };
