import { ActionState } from '@store/session/models';
export interface ScriptItem {
  name: string;
  id?: string;
  script: string;
  useServiceAccount: boolean;
  description?: string;
  runnerRoles: string[];
}
export interface ScriptService {
  scripts: Record<string, ScriptItem>;
  indicator?: Indicator;
  scriptResponse?: string[];
}
export const defaultScript: ScriptItem = {
  name: '',
  id: '',
  script: '',
  useServiceAccount: false,
  description: '',
  runnerRoles: [],
};
export const SCRIPT_INIT: ScriptService = {
  scripts: null,
  indicator: {
    details: {},
  },
  scriptResponse: null,
};
export interface Indicator {
  details?: Record<string, ActionState>;
}
