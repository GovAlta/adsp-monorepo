export type Configuration<C, O = undefined> = O extends undefined ? C : C & { options: O };
