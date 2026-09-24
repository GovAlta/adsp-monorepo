import type { ReportSectionId } from '@pages/admin/reports/registry/types';
import {
  LOAD_REPORT_SECTION_ACTION,
  LOAD_REPORT_SECTION_FAILURE_ACTION,
  LOAD_REPORT_SECTION_SUCCESS_ACTION,
  SET_REPORT_CRITERIA_ACTION,
  ServiceReportsActionTypes,
} from './actions';
import { ReportingPeriod, SectionState, ServiceReportsState } from './models';
import { resolvePeriodRange } from './selectors';

const defaultPeriod: ReportingPeriod = {
  preset: 'last30Days',
  ...resolvePeriodRange('last30Days'),
};

const defaultState: ServiceReportsState = {
  criteria: { serviceId: null, period: defaultPeriod },
  sections: {},
};

const updateSection = (
  state: ServiceReportsState,
  serviceId: string,
  sectionId: ReportSectionId,
  change: Partial<SectionState>
): ServiceReportsState => ({
  ...state,
  sections: {
    ...state.sections,
    [serviceId]: {
      ...state.sections[serviceId],
      [sectionId]: {
        status: 'idle',
        data: null,
        ...state.sections[serviceId]?.[sectionId],
        ...change,
      },
    },
  },
});

export default function (
  state: ServiceReportsState = defaultState,
  action: ServiceReportsActionTypes
): ServiceReportsState {
  switch (action.type) {
    case SET_REPORT_CRITERIA_ACTION:
      return {
        ...state,
        criteria: {
          serviceId: action.serviceId,
          period: action.period,
        },
      };
    case LOAD_REPORT_SECTION_ACTION:
      return updateSection(state, action.serviceId, action.sectionId, { status: 'loading', error: undefined });
    case LOAD_REPORT_SECTION_SUCCESS_ACTION:
      return updateSection(state, action.serviceId, action.sectionId, {
        status: 'loaded',
        data: action.data,
        loadedForKey: action.key,
        error: undefined,
      });
    case LOAD_REPORT_SECTION_FAILURE_ACTION:
      return updateSection(state, action.serviceId, action.sectionId, {
        status: 'error',
        error: action.error,
        loadedForKey: action.key,
      });
    default:
      return state;
  }
}
