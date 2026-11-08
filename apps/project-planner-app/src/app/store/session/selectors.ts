import { PLANNER_SERVICE_ID } from '../config/slice';
import type { SessionState } from './slice';

const plannerRoles = (state: { session: SessionState }): string[] =>
  state.session.resourceAccess?.[PLANNER_SERVICE_ID]?.roles ?? [];

export const selectUserId = (state: { session: SessionState }): string | undefined => state.session.userId;

export const selectIsPlannerAdmin = (state: { session: SessionState }): boolean =>
  plannerRoles(state).includes('planner-admin');

export const selectIsPlannerUser = (state: { session: SessionState }): boolean =>
  plannerRoles(state).some((role) => role === 'planner-user' || role === 'planner-admin');
