import type { ReportSectionId } from '@pages/admin/reports/registry/types';

export type ReportPeriodPreset = 'last7Days' | 'last30Days' | 'last90Days' | 'last12Months' | 'custom';

export const REPORT_PERIOD_PRESETS: ReportPeriodPreset[] = [
  'last7Days',
  'last30Days',
  'last90Days',
  'last12Months',
  'custom',
];

export interface ReportingPeriod {
  preset: ReportPeriodPreset;
  /** ISO date (yyyy-mm-dd). Required when preset is 'custom', derived otherwise. */
  from: string;
  /** ISO date (yyyy-mm-dd), inclusive. */
  to: string;
}

export type SectionStatus = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Uniform tracking envelope for every report section.
 * Solving loading/empty/error/stale once here is what lets later tickets add
 * data without adding state-machine code.
 */
export interface SectionState<T = unknown> {
  status: SectionStatus;
  data: T | null;
  error?: string;
  /**
   * Fingerprint of the criteria the current `data` was loaded for.
   * Lets the page skip refetching unchanged sections and detect stale data
   * when criteria change. See criteriaKey() in selectors.ts.
   */
  loadedForKey?: string;
}

export type ServiceSectionStates = Partial<Record<ReportSectionId, SectionState>>;

export interface ServiceReportsState {
  criteria: {
    /** Descriptor id, e.g. 'pdf'. Null before the URL is read. */
    serviceId: string | null;
    period: ReportingPeriod;
  };
  /** Keyed by serviceId, then sectionId. Sparse — absent means never requested. */
  sections: Record<string, ServiceSectionStates>;
}
