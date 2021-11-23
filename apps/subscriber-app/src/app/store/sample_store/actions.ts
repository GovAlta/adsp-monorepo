export const FETCH_NOTICES_ACTION = 'status/notices/fetch';

export interface FetchNoticesAction {
  type: typeof FETCH_NOTICES_ACTION;
  payload?: string;
}
export type ActionTypes = FetchNoticesAction;
export const fetchNotices = (realm: string): FetchNoticesAction => ({
  type: 'status/notices/fetch',
  payload: realm,
});
