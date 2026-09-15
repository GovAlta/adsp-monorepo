import type { ReportingPeriod } from '@store/serviceReports/models';

/** The reporting sections a service report page can contain, in no particular order. */
export type ReportSectionId = 'summary' | 'trends' | 'topResources' | 'insights' | 'apiDrilldown';

/** How a summary metric's raw value should be rendered once data exists. */
export type SummaryMetricFormat = 'count' | 'duration' | 'percent';

export interface SummaryMetricDescriptor {
  /** Stable key, also used as the card's test id suffix. */
  id: string;
  /** Human label shown on the card. */
  label: string;
  format: SummaryMetricFormat;
}

export interface ServiceReportDescriptor {
  /** Stable id, used as the `:serviceId` URL segment. Lowercase kebab-case. */
  id: string;
  /** Label shown in the service selector. */
  label: string;
  /** ADSP service URN, e.g. 'urn:ads:platform:pdf-service'. */
  serviceUrn: string;
  /**
   * `name` of the matching entry in featureFlag.ts `serviceVariables`, used to
   * hide the report when the service itself is disabled for the tenant.
   */
  featureName: string;
  /** Role required to view this service's report, checked against session.resourceAccess. */
  requiredRole?: string;
  /** Sections to render, in render order. */
  sections: ReportSectionId[];
  /** Summary cards. Labels only until a loader is registered. */
  summaryMetrics?: SummaryMetricDescriptor[];
  /** Noun for the top-resources section, e.g. 'Templates'. */
  topResourcesLabel?: string;
}

export interface SectionLoaderContext {
  descriptor: ServiceReportDescriptor;
  period: ReportingPeriod;
  token: string;
  serviceUrls: Record<string, string>;
}

export type SectionLoader<T = unknown> = (context: SectionLoaderContext) => Promise<T>;

export interface ReportSectionProps {
  descriptor: ServiceReportDescriptor;
}
