import { serviceVariables } from '../../../../../featureFlag';
import { ReportSectionId, SectionLoader, ServiceReportDescriptor } from './types';
import { pdfReport } from './services/pdfReport';

/** Every service with a report. Add new services here and nowhere else. */
const descriptors: ServiceReportDescriptor[] = [pdfReport];

const loaders = new Map<string, SectionLoader>();

const loaderKey = (serviceId: string, sectionId: ReportSectionId) => `${serviceId}:${sectionId}`;

export const getServiceReport = (serviceId: string): ServiceReportDescriptor | undefined =>
  descriptors.find(({ id }) => id === serviceId);

/**
 * Reports available to this tenant: registered AND enabled in featureFlag.ts.
 * Filtering here keeps Reports from drifting when a service is flagged off.
 */
export const getAvailableServiceReports = (
  featureFlags: Record<string, boolean>
): ServiceReportDescriptor[] => {
  const enabled = new Set(serviceVariables(featureFlags).map(({ name }) => name));
  return descriptors.filter(({ featureName }) => enabled.has(featureName));
};

/** The report shown when no service is specified in the URL. */
export const getDefaultServiceReport = (
  featureFlags: Record<string, boolean>
): ServiceReportDescriptor | undefined => getAvailableServiceReports(featureFlags)[0];

/** Called by a later ticket to attach real data to one section of one service. */
export const registerSectionLoader = <T>(
  serviceId: string,
  sectionId: ReportSectionId,
  loader: SectionLoader<T>
): void => {
  loaders.set(loaderKey(serviceId, sectionId), loader as SectionLoader);
};

/** `undefined` means the section has no data source yet and renders its placeholder. */
export const getSectionLoader = (
  serviceId: string,
  sectionId: ReportSectionId
): SectionLoader | undefined => loaders.get(loaderKey(serviceId, sectionId));

export const resetSectionLoaders = (): void => {
  loaders.clear();
};
