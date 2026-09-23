import { SagaIterator } from '@redux-saga/core';
import { call, put, select, takeEvery } from 'redux-saga/effects';
import axios from 'axios';
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

export const REPORT_SECTION_LOAD_ERROR = 'Something went wrong. Try again.';

const isUnauthorized = (err: unknown): boolean => axios.isAxiosError(err) && err.response?.status === 401;

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
    let token: string | undefined = yield call(getAccessToken);
    if (!token) {
      token = yield call(getAccessToken, true);
    }
    if (!token) {
      yield put(loadReportSectionFailure(serviceId, sectionId, key, REPORT_SECTION_LOAD_ERROR));
      return;
    }

    const serviceUrls = yield select((state: RootState) => state.config.serviceUrls);
    const loaderArgs = {
      descriptor,
      period: criteria.period,
      token,
      serviceUrls: serviceUrls || {},
    };

    let data;
    try {
      data = yield call(loader, loaderArgs);
    } catch (err) {
      if (!isUnauthorized(err)) {
        throw err;
      }
      token = yield call(getAccessToken, true);
      if (!token) {
        throw err;
      }
      data = yield call(loader, { ...loaderArgs, token });
    }

    const latestCriteria = yield select((state: RootState) => state.serviceReports.criteria);
    if (criteriaKey(latestCriteria) !== key) {
      return;
    }
    yield put(loadReportSectionSuccess(serviceId, sectionId, key, data));
  } catch (err) {
    const latestCriteria = yield select((state: RootState) => state.serviceReports.criteria);
    if (criteriaKey(latestCriteria) !== key) {
      return;
    }
    yield put(loadReportSectionFailure(serviceId, sectionId, key, REPORT_SECTION_LOAD_ERROR));
  }
}

export function* watchServiceReportsSagas(): Generator {
  yield takeEvery(LOAD_REPORT_SECTION_ACTION, loadReportSection);
}
