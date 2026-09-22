export type ReportSectionId = 'summary' | 'trends' | 'topResources' | 'insights' | 'apiDrilldown';

export interface ReportPeriod {
  from: string;
  to: string;
}

export interface ReportSectionResponse<T = unknown> {
  serviceId: string;
  sectionId: ReportSectionId;
  period: ReportPeriod;
  data: T | null;
}

export interface ReportHandlerContext {
  serviceId: string;
  sectionId: ReportSectionId;
  period: ReportPeriod;
  token: string;
}

export type ReportHandler = (context: ReportHandlerContext) => Promise<unknown | null>;

export type ReportCatalog = Record<string, Partial<Record<ReportSectionId, ReportHandler>>>;

export interface MetricIntervalValue {
  interval: string;
  sum?: string | number;
  avg?: string | number;
  min?: string | number;
  max?: string | number;
  count?: string | number;
}

export interface MetricResult {
  name: string;
  values: MetricIntervalValue[];
}

export type EventMetrics = Record<string, MetricResult>;
