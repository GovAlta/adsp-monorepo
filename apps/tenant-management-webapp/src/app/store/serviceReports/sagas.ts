import { SagaIterator } from '@redux-saga/core';
import { call, put, select, takeEvery } from 'redux-saga/effects';
import { getSectionLoader, getServiceReport } from '@pages/admin/reports/registry/serviceReportRegistry';
import { RootState } from '@store/index';
import { getAccessToken } from '@store/tenant/sagas';
import {
  LOAD_REPORT_SECTION_ACTION,
  LoadReportSectionAction,
  loadReportSectionFailure,
  loadReportSectionSuccess,
} from './actions';
import { criteriaKey } from './selectors';

export function* loadReportSection(action: LoadReportSectionAction): SagaIterator {
  const { serviceId, sectionId } = action;

  const descriptor = getServiceReport(serviceId);
  const loader = getSectionLoader(serviceId, sectionId);

  // No data source registered yet — the section renders its placeholder.
  if (!descriptor || !loader) {
    return;
  }

  const criteria = yield select((state: RootState) => state.serviceReports.criteria);
  const key = criteriaKey(criteria);

  try {
    const token: string = yield call(getAccessToken);
    const serviceUrls = yield select((state: RootState) => state.config.serviceUrls);
    const data = yield call(loader, {
      descriptor,
      period: criteria.period,
      token,
      serviceUrls: serviceUrls || {},
    });
    yield put(loadReportSectionSuccess(serviceId, sectionId, key, data));
  } catch (err) {
    yield put(loadReportSectionFailure(serviceId, sectionId, key, `${err}`));
  }
}

export function* watchServiceReportsSagas(): Generator {
  yield takeEvery(LOAD_REPORT_SECTION_ACTION, loadReportSection);
}
