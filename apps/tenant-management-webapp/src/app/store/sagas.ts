import { all, takeEvery, takeLatest, takeLeading } from 'redux-saga/effects';

// Sagas
import { fetchAccess, fetchServiceRoles, fetchKeycloakServiceRoles } from './access/sagas';
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
} from './status/sagas';
import { watchEventSagas } from './event/sagas';
import { watchPdfSagas } from './pdf/sagas';
import { watchFileSagas } from './file/sagas';
import { watchConfigurationSagas } from './configuration/sagas';
import {
  fetchDirectory,
  createEntryDirectory,
  updateEntryDirectory,
  deleteEntryDirectory,
  fetchEntryDetail,
  fetchDirectoryByDetailURNs,
} from './directory/sagas';
import { watchNotificationSagas } from './notification/sagas';
import { watchSubscriptionSagas } from './subscription/sagas';

// Actions
import { FETCH_ACCESS_ACTION, FETCH_SERVICE_ROLES, FETCH_KEYCLOAK_SERVICE_ROLES } from './access/actions';
import { FETCH_CONFIG_ACTION } from './config/actions';
import {
  FETCH_DIRECTORY,
  CREATE_ENTRY,
  UPDATE_ENTRY,
  DELETE_ENTRY,
  FETCH_ENTRY_DETAIL,
  FETCH_ENTRY_DETAIL_BY_URNS,
} from './directory/actions';
import {
  DELETE_APPLICATION_ACTION,
  FETCH_SERVICE_STATUS_APPS_ACTION,
  FETCH_STATUS_METRICS_ACTION,
  SAVE_APPLICATION_ACTION,
  UPDATE_STATUS_CONTACT_INFORMATION,
  FETCH_STATUS_CONFIGURATION,
} from './status/actions';
import { SAVE_NOTICE_ACTION, GET_NOTICES_ACTION, DELETE_NOTICE_ACTION } from './notice/actions';
import { saveNotice, getNotices, deleteNotice } from './notice/sagas';
import { SET_APPLICATION_STATUS_ACTION } from './status/actions/setApplicationStatus';
import { TOGGLE_APPLICATION_STATUS_ACTION } from './status/actions/toggleApplication';
import { watchServiceMetricsSagas } from './metrics/sagas';

// eslint-disable-next-line  @typescript-eslint/explicit-module-boundary-types
export function* watchSagas() {
  yield takeEvery(FETCH_CONFIG_ACTION, fetchConfig);
  yield takeLatest(FETCH_ACCESS_ACTION, fetchAccess);
  yield takeLatest(FETCH_SERVICE_ROLES, fetchServiceRoles);
  yield takeLatest(FETCH_KEYCLOAK_SERVICE_ROLES, fetchKeycloakServiceRoles);

  //directory
  yield takeEvery(FETCH_DIRECTORY, fetchDirectory);
  yield takeEvery(CREATE_ENTRY, createEntryDirectory);
  yield takeEvery(UPDATE_ENTRY, updateEntryDirectory);
  yield takeEvery(DELETE_ENTRY, deleteEntryDirectory);
  yield takeEvery(FETCH_ENTRY_DETAIL, fetchEntryDetail);
  yield takeLeading(FETCH_ENTRY_DETAIL_BY_URNS, fetchDirectoryByDetailURNs);
  // service status
  yield takeEvery(FETCH_SERVICE_STATUS_APPS_ACTION, fetchServiceStatusApps);
  yield takeEvery(SAVE_APPLICATION_ACTION, saveApplication);
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
    // service metrics
    watchServiceMetricsSagas(),
  ]);
}
