import { ScriptItem, ScriptResponse, Indicator } from './models';
export const UPDATE_INDICATOR = 'calendar/indicator';

export const UPDATE_SCRIPT_ACTION = 'script/UPDATE_SCRIPT_ACTION';
export const UPDATE_SCRIPT_SUCCESS_ACTION = 'script/UPDATE_SCRIPT_SUCCESS_ACTION';

export const FETCH_SCRIPTS_ACTION = 'script/FETCH_SCRIPTS_ACTION';
export const FETCH_SCRIPTS_SUCCESS_ACTION = 'script/FETCH_SCRIPTS_SUCCESS_ACTION';

export const DELETE_SCRIPT_ACTION = 'script/DELETE_SCRIPT_ACTION';
export const DELETE_SCRIPT_SUCCESS_ACTION = 'script/DELETE_SCRIPT_ACTION_SUCCESS';

export const RUN_SCRIPT_ACTION = 'script/RUN_SCRIPT_ACTION';
export const EXECUTE_SCRIPT_ACTION = 'script/EXECUTE_SCRIPT_ACTION';
export const RUN_SCRIPT_ACTION_SUCCESS = 'script/RUN_SCRIPT_ACTION_SUCCESS';
export const CLEAR_SCRIPTS_ACTION = 'script/CLEAR_SCRIPTS_ACTION';

export interface UpdateScriptAction {
  type: typeof UPDATE_SCRIPT_ACTION;
  payload: ScriptItem;
  executeOnCompletion?: boolean;
}

export interface RunScriptSuccessAction {
  type: typeof RUN_SCRIPT_ACTION_SUCCESS;
  payload: ScriptResponse;
}

export interface RunScriptAction {
  type: typeof RUN_SCRIPT_ACTION;
  payload: ScriptItem;
}

export interface ClearScriptsAction {
  type: typeof CLEAR_SCRIPTS_ACTION;
}

export interface ExecuteScriptAction {
  type: typeof EXECUTE_SCRIPT_ACTION;
  payload: ScriptItem;
}

export interface UpdateScriptSuccessAction {
  type: typeof UPDATE_SCRIPT_SUCCESS_ACTION;
  payload: Record<string, ScriptItem>;
}

export interface DeleteScriptAction {
  type: typeof DELETE_SCRIPT_ACTION;
  scriptId: string;
}
export interface DeleteScriptSuccessAction {
  type: typeof DELETE_SCRIPT_SUCCESS_ACTION;
  scriptId: string;
}
export interface FetchScriptsAction {
  type: typeof FETCH_SCRIPTS_ACTION;
}
export interface FetchScriptsSuccessAction {
  type: typeof FETCH_SCRIPTS_SUCCESS_ACTION;
  payload: Record<string, ScriptItem>;
}

export interface UpdateIndicatorAction {
  type: typeof UPDATE_INDICATOR;
  payload: Indicator;
}
export type ActionTypes =
  | UpdateScriptAction
  | UpdateScriptSuccessAction
  | FetchScriptsAction
  | FetchScriptsSuccessAction
  | UpdateIndicatorAction
  | DeleteScriptAction
  | DeleteScriptSuccessAction
  | RunScriptAction
  | ClearScriptsAction
  | RunScriptSuccessAction;

export const UpdateScript = (payload: ScriptItem, executeOnCompletion: boolean): UpdateScriptAction => ({
  type: UPDATE_SCRIPT_ACTION,
  payload,
  executeOnCompletion,
});

export const SaveAndExecuteScript = (payload: ScriptItem): RunScriptAction => ({
  type: RUN_SCRIPT_ACTION,
  payload,
});

export const ClearScripts = (): ClearScriptsAction => ({
  type: CLEAR_SCRIPTS_ACTION,
});

export const ExecuteScript = (payload: ScriptItem): ExecuteScriptAction => ({
  type: EXECUTE_SCRIPT_ACTION,
  payload,
});

export const runScriptSuccess = (response: ScriptResponse): RunScriptSuccessAction => ({
  type: RUN_SCRIPT_ACTION_SUCCESS,
  payload: response,
});

export const UpdateScriptSuccess = (script: Record<string, ScriptItem>): UpdateScriptSuccessAction => ({
  type: UPDATE_SCRIPT_SUCCESS_ACTION,
  payload: script,
});
export const fetchScripts = (): FetchScriptsAction => ({
  type: FETCH_SCRIPTS_ACTION,
});

export const fetchScriptsSuccess = (scripts: Record<string, ScriptItem>): FetchScriptsSuccessAction => ({
  type: FETCH_SCRIPTS_SUCCESS_ACTION,
  payload: scripts,
});

export const UpdateIndicator = (indicator: Indicator): UpdateIndicatorAction => ({
  type: UPDATE_INDICATOR,
  payload: indicator,
});

export const DeleteScript = (scriptId: string): DeleteScriptAction => ({
  type: DELETE_SCRIPT_ACTION,
  scriptId: scriptId,
});

export const DeleteScriptSuccess = (scriptId: string): DeleteScriptSuccessAction => ({
  type: DELETE_SCRIPT_SUCCESS_ACTION,
  scriptId: scriptId,
});
