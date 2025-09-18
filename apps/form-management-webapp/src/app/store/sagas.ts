import { all, takeEvery, takeLatest } from 'redux-saga/effects';

// Sagas
import { fetchAccess, fetchServiceRoles, fetchKeycloakServiceRoles, createKeycloakClient } from './access/sagas';
import { fetchConfig } from './config/sagas';
import { watchTenantSagas } from './tenant/sagas';
import { watchStreamSagas } from './stream/saga';
import {
  deleteApplication,
  fetchServiceStatusApps,
  fetchStatusMetrics,
  saveApplication,
  setApplicationStatus,
  toggleApplicationStatus,
  updateStatusContactInformation,
  fetchStatusConfiguration,
  saveWebhook,
  fetchWebhook,
  deleteWebhook,
  testWebhook,
} from './status/sagas';
import { watchEventSagas } from './event/sagas';
import { watchPdfSagas } from './pdf/sagas';
import { watchFormSagas } from './form/sagas';
import { watchCacheSagas } from './cache/sagas';
import { watchCommentSagas } from './comment/sagas';
import { watchTaskSagas } from './task/sagas';
import { watchFeedbackSagas } from './feedback/sagas';
import { watchFileSagas } from './file/sagas';
import { watchConfigurationSagas } from './configuration/sagas';

import { watchNotificationSagas } from './notification/sagas';
import { watchSubscriptionSagas } from './subscription/sagas';
import { watchCalendarSagas } from './calendar/sagas';
// Actions
import {
  FETCH_ACCESS_ACTION,
  FETCH_SERVICE_ROLES,
  FETCH_KEYCLOAK_SERVICE_ROLES,
  CREATE_KEYCLOAK_ROLE,
} from './access/actions';
import { FETCH_CONFIG_ACTION } from './config/actions';

import {
  DELETE_APPLICATION_ACTION,
  FETCH_SERVICE_STATUS_APPS_ACTION,
  FETCH_STATUS_METRICS_ACTION,
  SAVE_APPLICATION_ACTION,
  SAVE_WEBHOOK_ACTION,
  UPDATE_STATUS_CONTACT_INFORMATION,
  FETCH_STATUS_CONFIGURATION,
  FETCH_WEBHOOK_ACTION,
  DELETE_WEBHOOK_ACTION,
  TEST_WEBHOOK_ACTION,
} from './status/actions';
import { SAVE_NOTICE_ACTION, GET_NOTICES_ACTION, DELETE_NOTICE_ACTION } from './notice/actions';
import { saveNotice, getNotices, deleteNotice } from './notice/sagas';
import { SET_APPLICATION_STATUS_ACTION } from './status/actions/setApplicationStatus';
import { TOGGLE_APPLICATION_STATUS_ACTION } from './status/actions/toggleApplication';
import { watchServiceMetricsSagas } from './metrics/sagas';
import { watchScriptSagas } from './script/sagas';
import { watchValueSagas } from './value/sagas';
import { watchDirectorySagas } from './directory/sagas';

// eslint-disable-next-line  @typescript-eslint/explicit-module-boundary-types
export function* watchSagas() {
  yield takeEvery(FETCH_CONFIG_ACTION, fetchConfig);
  yield takeLatest(FETCH_ACCESS_ACTION, fetchAccess);
  yield takeLatest(FETCH_SERVICE_ROLES, fetchServiceRoles);
  yield takeLatest(FETCH_KEYCLOAK_SERVICE_ROLES, fetchKeycloakServiceRoles);
  yield takeEvery(CREATE_KEYCLOAK_ROLE, createKeycloakClient);

  // service status
  yield takeEvery(FETCH_SERVICE_STATUS_APPS_ACTION, fetchServiceStatusApps);
  yield takeEvery(SAVE_APPLICATION_ACTION, saveApplication);
  yield takeEvery(SAVE_WEBHOOK_ACTION, saveWebhook);
  yield takeEvery(FETCH_WEBHOOK_ACTION, fetchWebhook);
  yield takeEvery(DELETE_WEBHOOK_ACTION, deleteWebhook);
  yield takeEvery(TEST_WEBHOOK_ACTION, testWebhook);

  yield takeEvery(DELETE_APPLICATION_ACTION, deleteApplication);
  yield takeEvery(SET_APPLICATION_STATUS_ACTION, setApplicationStatus);
  yield takeEvery(TOGGLE_APPLICATION_STATUS_ACTION, toggleApplicationStatus);
  yield takeEvery(UPDATE_STATUS_CONTACT_INFORMATION, updateStatusContactInformation);
  yield takeEvery(FETCH_STATUS_CONFIGURATION, fetchStatusConfiguration);
  yield takeLatest(FETCH_STATUS_METRICS_ACTION, fetchStatusMetrics);

  // notices
  yield takeEvery(SAVE_NOTICE_ACTION, saveNotice);
  yield takeEvery(GET_NOTICES_ACTION, getNotices);
  yield takeEvery(DELETE_NOTICE_ACTION, deleteNotice);

  yield all([
    // keycloak and tenant
    watchTenantSagas(),
    // file service
    watchFileSagas(),
    // event
    watchEventSagas(),
    // notification
    watchNotificationSagas(),
    // subscription
    watchSubscriptionSagas(),
    //configuration
    watchConfigurationSagas(),
    // event stream
    watchStreamSagas(),
    //pdf
    watchPdfSagas(),
    //form
    watchFormSagas(),
    //form
    watchCommentSagas(),
    //task
    watchTaskSagas(),
    //feedback
    watchFeedbackSagas(),
    // service metrics
    watchServiceMetricsSagas(),
    //Calendar
    watchCalendarSagas(),
    //Script
    watchScriptSagas(),
    //Value
    watchValueSagas(),
    //Directory
    watchDirectorySagas(),
    //Cache
    watchCacheSagas(),
  ]);

  // yield all([watchNotixSagas()]);
}
