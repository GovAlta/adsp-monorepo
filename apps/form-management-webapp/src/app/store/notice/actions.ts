import { Notice } from './models';

export const SAVE_NOTICE_ACTION = 'notice/SAVE_NOTICE';
export const SAVE_NOTICE_SUCCESS_ACTION = 'notice/SAVE_NOTICE_SUCCESS';
export const DELETE_NOTICE_ACTION = 'notice/DELETE_NOTICE';
export const DELETE_NOTICE_SUCCESS_ACTION = 'notice/DELETE_NOTICE_SUCCESS';
export const GET_NOTICES_ACTION = 'notice/GET_NOTICES';
export const GET_NOTICES_SUCCESS_ACTION = 'notice/GET_NOTICES_SUCCESS';

export type ActionTypes =
  | SaveNoticeAction
  | GetNoticesAction
  | DeleteNoticeAction
  | DeleteNoticeSuccessAction
  | GetNoticesSuccessAction
  | SaveNoticeActionSuccessAction;

export interface SaveNoticeAction {
  type: typeof SAVE_NOTICE_ACTION;
  payload: Notice;
}
export interface SaveNoticeActionSuccessAction {
  type: typeof SAVE_NOTICE_SUCCESS_ACTION;
  payload: Notice;
}

export interface GetNoticesAction {
  type: typeof GET_NOTICES_ACTION;
}

export interface GetNoticesSuccessAction {
  type: typeof GET_NOTICES_SUCCESS_ACTION;
  payload: Notice[];
}
export interface DeleteNoticeAction {
  type: typeof DELETE_NOTICE_ACTION;
  payload: string;
}
export interface DeleteNoticeSuccessAction {
  type: typeof DELETE_NOTICE_SUCCESS_ACTION;
  payload: Notice;
}

export const getNotices = (): GetNoticesAction => ({
  type: 'notice/GET_NOTICES',
});

export const getNoticesSuccess = (payload: Notice[]): GetNoticesSuccessAction => ({
  type: 'notice/GET_NOTICES_SUCCESS',
  payload,
});

export const saveNotice = (payload: Notice): SaveNoticeAction => ({
  type: 'notice/SAVE_NOTICE',
  payload,
});

export const saveNoticeSuccess = (payload: Notice): SaveNoticeActionSuccessAction => ({
  type: 'notice/SAVE_NOTICE_SUCCESS',
  payload,
});

export const deleteNotice = (payload: string): DeleteNoticeAction => ({
  type: 'notice/DELETE_NOTICE',
  payload,
});

export const deleteNoticeSuccess = (payload: Notice): DeleteNoticeSuccessAction => ({
  type: 'notice/DELETE_NOTICE_SUCCESS',
  payload,
});
