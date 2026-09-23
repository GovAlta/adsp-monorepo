import { DateTime } from 'luxon';
import { getSectionLoader } from '@pages/admin/reports/registry/serviceReportRegistry';
import type { ReportSectionId } from '@pages/admin/reports/registry/types';
import type { RootState } from '@store/index';
import { ReportPeriodPreset, ReportingPeriod, SectionState, ServiceReportsState } from './models';

/**
 * Stable fingerprint of the criteria a section's data belongs to.
 * Order of fields must never change, or cached data silently mismatches.
 */
export const criteriaKey = ({ serviceId, period }: ServiceReportsState['criteria']): string =>
  `${serviceId}|${period.preset}|${period.from}|${period.to}`;

/** Resolve a preset to a concrete inclusive date range, relative to today. */
export const resolvePeriodRange = (preset: ReportPeriodPreset): { from: string; to: string } => {
  const to = DateTime.now().startOf('day');
  let from: DateTime;
  switch (preset) {
    case 'last7Days':
      from = to.minus({ days: 6 });
      break;
    case 'last30Days':
      from = to.minus({ days: 29 });
      break;
    case 'last90Days':
      from = to.minus({ days: 89 });
      break;
    case 'last12Months':
      from = to.minus({ months: 12 });
      break;
    case 'custom':
      from = to.minus({ days: 29 });
      break;
    default:
      from = to.minus({ days: 29 });
      break;
  }
  return { from: from.toISODate(), to: to.toISODate() };
};

const emptySection: SectionState = { status: 'idle', data: null };
const pendingLoadSection: SectionState = { status: 'loading', data: null };

export const selectSectionState =
  (serviceId: string, sectionId: ReportSectionId) =>
  (state: RootState): SectionState =>
    state.serviceReports.sections[serviceId]?.[sectionId] ?? emptySection;

/**
 * Idle + a registered loader means a fetch is about to start. Treat that as loading
 * so the first paint is a skeleton instead of a placeholder flash.
 */
export const selectSectionDisplayState =
  (serviceId: string, sectionId: ReportSectionId) =>
  (state: RootState): SectionState => {
    const section = selectSectionState(serviceId, sectionId)(state);
    if (section.status === 'idle' && getSectionLoader(serviceId, sectionId)) {
      return section.data == null ? pendingLoadSection : { ...section, status: 'loading' };
    }
    return section;
  };

/** True when data exists but was loaded for different criteria. */
export const selectIsSectionStale =
  (serviceId: string, sectionId: ReportSectionId) =>
  (state: RootState): boolean => {
    const section = selectSectionState(serviceId, sectionId)(state);
    return section.status === 'loaded' && section.loadedForKey !== criteriaKey(state.serviceReports.criteria);
  };

export const getPeriodValidationError = (period: Pick<ReportingPeriod, 'from' | 'to'>): string | undefined => {
  if (!period.from || !period.to) {
    return undefined;
  }
  const from = DateTime.fromISO(period.from);
  const to = DateTime.fromISO(period.to);
  if (!from.isValid || !to.isValid) {
    return undefined;
  }
  if (from > to) {
    return 'Start date must not be after end date.';
  }
  return undefined;
};
