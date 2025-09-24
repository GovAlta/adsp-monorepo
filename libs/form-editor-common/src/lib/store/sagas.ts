import { all, takeEvery } from 'redux-saga/effects';

import { fetchConfigSaga } from './config/sagas';

import { watchFormSagas } from './form/sagas';

import { watchTaskSagas } from './task/sagas';

import { watchFileSagas } from './file/sagas';

import { watchTenantSagas } from './tenant/sagas';

import { watchConfigurationSagas } from './configuration/sagas';

import { FETCH_CONFIG_ACTION } from './config/actions';

import { watchDirectorySagas } from './directory/sagas';

import { watchCalendarSagas } from './calendar/sagas';
import { watchPdfSagas } from './pdf/sagas';

// eslint-disable-next-line  @typescript-eslint/explicit-module-boundary-types
export function* watchSagas() {
  yield takeEvery(FETCH_CONFIG_ACTION, fetchConfigSaga);

  yield all([
    // keycloak and tenant
    watchTenantSagas(),

    watchFileSagas(),

    watchConfigurationSagas(),

    watchFormSagas(),

    watchTaskSagas(),

    watchCalendarSagas(),

    watchPdfSagas(),

    watchDirectorySagas(),
  ]);
}
