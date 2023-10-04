import { put, call, takeEvery } from 'redux-saga/effects';
import { ErrorNotification } from '@store/notifications/actions';
import { SagaIterator } from '@redux-saga/core';
import { FetchContactInfoSucceededService, FETCH_CONTACT_INFO, FetchContactInfoAction } from './actions';
import axios from 'axios';

export function* fetchContactInfo(action: FetchContactInfoAction): SagaIterator {
  const { realm, tenantId } = action.payload.tenant;
  try {
    let contactInfo = null;
    if (realm) {
      contactInfo = (yield call(axios.get, `/api/configuration/v1/support-info/${realm}`)).data;
    } else if (tenantId) {
      contactInfo = (yield call(axios.get, `/api/configuration/v1/support-info-tenant-id/${tenantId}`)).data;
    }

    yield put(FetchContactInfoSucceededService({ data: contactInfo }));
  } catch (err) {
    yield put(ErrorNotification({ error: err}));
  }
}

export function* watchNotificationSagas(): Generator {
  yield takeEvery(FETCH_CONTACT_INFO, fetchContactInfo);
}
