import type { Configuration } from '../../../../../../shared/contracts/configuration';
export type InitialState = {
    initialData: Partial<Configuration>;
    modifiedData: Partial<Configuration>;
};
declare const initialState: InitialState;
declare const init: (configData: InitialState['initialData']) => InitialState;
export { init, initialState };
