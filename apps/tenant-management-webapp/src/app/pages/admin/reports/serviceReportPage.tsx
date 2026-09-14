import { GoabCallout, GoabGrid } from '@abgov/react-components';
import { RootState } from '@store/index';
import { loadReportSection, setReportCriteria } from '@store/serviceReports/actions';
import { REPORT_PERIOD_PRESETS, ReportPeriodPreset, ReportingPeriod } from '@store/serviceReports/models';
import { resolvePeriodRange } from '@store/serviceReports/selectors';
import React, { FunctionComponent, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { ReportingPeriodSelector } from './controls/reportingPeriodSelector';
import { ServiceSelector } from './controls/serviceSelector';
import {
  getAvailableServiceReports,
  getDefaultServiceReport,
  getSectionLoader,
} from './registry/serviceReportRegistry';
import { ReportSectionId, ReportSectionProps, ServiceReportDescriptor } from './registry/types';
import { ApiDrilldownSection } from './sections/apiDrilldownSection';
import { InsightsSection } from './sections/insightsSection';
import { SummaryMetricsSection } from './sections/summaryMetricsSection';
import { TopResourcesSection } from './sections/topResourcesSection';
import { TrendsSection } from './sections/trendsSection';
import { reportsPath } from './paths';
import { ControlsRow, SectionsStack } from './styled-components';

const sectionComponents: Record<ReportSectionId, FunctionComponent<ReportSectionProps>> = {
  summary: SummaryMetricsSection,
  trends: TrendsSection,
  topResources: TopResourcesSection,
  insights: InsightsSection,
  apiDrilldown: ApiDrilldownSection,
};

const isPreset = (value: string): value is ReportPeriodPreset =>
  (REPORT_PERIOD_PRESETS as string[]).includes(value);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const parseReportPeriod = (searchParams: URLSearchParams): ReportingPeriod => {
  const raw = searchParams.get('preset');
  const preset: ReportPeriodPreset = raw && isPreset(raw) ? raw : 'last30Days';
  if (preset === 'custom') {
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (from && to && ISO_DATE.test(from) && ISO_DATE.test(to)) {
      return { preset, from, to };
    }
    return { preset: 'last30Days', ...resolvePeriodRange('last30Days') };
  }
  return { preset, ...resolvePeriodRange(preset) };
};

const hasRequiredRole = (descriptor: ServiceReportDescriptor, resourceAccess: RootState['session']['resourceAccess']) => {
  if (!descriptor.requiredRole) {
    return true;
  }
  return Boolean(resourceAccess?.[descriptor.serviceUrn]?.roles?.includes(descriptor.requiredRole));
};

export const ServiceReportPage: FunctionComponent = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const featureFlags = useSelector(
    (state: RootState) => (state.config.featureFlags || {}) as Record<string, boolean>
  );
  const resourceAccess = useSelector((state: RootState) => state.session?.resourceAccess);

  const search = searchParams.toString();
  const period = useMemo(() => parseReportPeriod(new URLSearchParams(search)), [search]);
  const available = getAvailableServiceReports(featureFlags);
  const descriptor = available.find((report) => report.id === serviceId);

  useEffect(() => {
    if (!descriptor) {
      return;
    }
    dispatch(setReportCriteria(descriptor.id, period));
    descriptor.sections.forEach((sectionId) => {
      if (getSectionLoader(descriptor.id, sectionId)) {
        dispatch(loadReportSection(descriptor.id, sectionId));
      }
    });
  }, [descriptor, dispatch, period]);

  if (!serviceId) {
    const defaultReport = getDefaultServiceReport(featureFlags);
    if (!defaultReport) {
      return (
        <GoabCallout type="important" heading="Report not available" testId="reports-not-available">
          Report not available
        </GoabCallout>
      );
    }
    return <Navigate to={reportsPath(defaultReport.id, searchParams.toString())} replace />;
  }

  if (!descriptor) {
    return (
      <GoabCallout type="important" heading="Report not available" testId="reports-not-available">
        Report not available
      </GoabCallout>
    );
  }

  return (
    <>
      <ControlsRow>
        <GoabGrid gap="s" minChildWidth="30ch" testId="reports-controls">
          <ServiceSelector />
          <ReportingPeriodSelector />
        </GoabGrid>
      </ControlsRow>
      {hasRequiredRole(descriptor, resourceAccess) ? (
        <SectionsStack>
          {descriptor.sections.map((sectionId) => {
            const Section = sectionComponents[sectionId];
            return <Section key={sectionId} descriptor={descriptor} />;
          })}
        </SectionsStack>
      ) : (
        <GoabCallout heading="Role required" type="information" testId="reports-role-need-callout">
          You need the {descriptor.requiredRole} role to view this report.
        </GoabCallout>
      )}
    </>
  );
};
