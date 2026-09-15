import type { ReportSectionId } from '@pages/admin/reports/registry/types';
import { ReportingPeriod } from './models';

export const SET_REPORT_CRITERIA_ACTION = 'serviceReports/SET_REPORT_CRITERIA';
export const LOAD_REPORT_SECTION_ACTION = 'serviceReports/LOAD_REPORT_SECTION';
export const LOAD_REPORT_SECTION_SUCCESS_ACTION = 'serviceReports/LOAD_REPORT_SECTION_SUCCESS';
export const LOAD_REPORT_SECTION_FAILURE_ACTION = 'serviceReports/LOAD_REPORT_SECTION_FAILURE';

export interface SetReportCriteriaAction {
  type: typeof SET_REPORT_CRITERIA_ACTION;
  serviceId: string;
  period: ReportingPeriod;
}

export interface LoadReportSectionAction {
  type: typeof LOAD_REPORT_SECTION_ACTION;
  serviceId: string;
  sectionId: ReportSectionId;
}

export interface LoadReportSectionSuccessAction {
  type: typeof LOAD_REPORT_SECTION_SUCCESS_ACTION;
  serviceId: string;
  sectionId: ReportSectionId;
  key: string;
  data: unknown;
}

export interface LoadReportSectionFailureAction {
  type: typeof LOAD_REPORT_SECTION_FAILURE_ACTION;
  serviceId: string;
  sectionId: ReportSectionId;
  key: string;
  error: string;
}

export type ServiceReportsActionTypes =
  | SetReportCriteriaAction
  | LoadReportSectionAction
  | LoadReportSectionSuccessAction
  | LoadReportSectionFailureAction;

export const setReportCriteria = (serviceId: string, period: ReportingPeriod): SetReportCriteriaAction => ({
  type: SET_REPORT_CRITERIA_ACTION,
  serviceId,
  period,
});

export const loadReportSection = (serviceId: string, sectionId: ReportSectionId): LoadReportSectionAction => ({
  type: LOAD_REPORT_SECTION_ACTION,
  serviceId,
  sectionId,
});

export const loadReportSectionSuccess = (
  serviceId: string,
  sectionId: ReportSectionId,
  key: string,
  data: unknown
): LoadReportSectionSuccessAction => ({
  type: LOAD_REPORT_SECTION_SUCCESS_ACTION,
  serviceId,
  sectionId,
  key,
  data,
});

export const loadReportSectionFailure = (
  serviceId: string,
  sectionId: ReportSectionId,
  key: string,
  error: string
): LoadReportSectionFailureAction => ({
  type: LOAD_REPORT_SECTION_FAILURE_ACTION,
  serviceId,
  sectionId,
  key,
  error,
});
