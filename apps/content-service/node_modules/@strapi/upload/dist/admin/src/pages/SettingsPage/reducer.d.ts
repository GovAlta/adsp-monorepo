import { SettingsData } from '../../../../shared/contracts/settings';
export type InitialState = {
    initialData: SettingsData | null;
    modifiedData: SettingsData | null;
};
interface ActionGetDataSucceeded {
    type: 'GET_DATA_SUCCEEDED';
    data: InitialState['initialData'];
}
interface ActionOnChange {
    type: 'ON_CHANGE';
    keys: keyof NonNullable<InitialState['initialData']>;
    value: boolean;
}
export type Action = ActionGetDataSucceeded | ActionOnChange;
declare const initialState: InitialState;
declare const reducer: (state: InitialState, action: Action) => InitialState;
export { initialState, reducer };
