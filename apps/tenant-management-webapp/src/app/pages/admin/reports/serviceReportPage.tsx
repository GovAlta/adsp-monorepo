import { GoabCallout } from '@abgov/react-components';
import { RootState } from '@store/index';
import { loadReportSection, setReportCriteria } from '@store/serviceReports/actions';
import { REPORT_PERIOD_PRESETS, ReportPeriodPreset, ReportingPeriod } from '@store/serviceReports/models';
import { resolvePeriodRange } from '@store/serviceReports/selectors';
import React, { FunctionComponent, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { ReportingPeriodSelector } from './controls/reportingPeriodSelector';
import { ServiceSelector } from './controls/serviceSelector';
import { registerPdfReportLoaders } from './registry/registerPdfLoaders';
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
import { ControlField, ControlsRow, RightRail, SectionsStack, TrendsRow } from './styled-components';

const sectionComponents: Record<ReportSectionId, FunctionComponent<ReportSectionProps>> = {
  summary: SummaryMetricsSection,
  trends: TrendsSection,
  topResources: TopResourcesSection,
  insights: InsightsSection,
  apiDrilldown: ApiDrilldownSection,
};

registerPdfReportLoaders();

const RIGHT_RAIL_SECTIONS: ReportSectionId[] = ['topResources', 'insights'];
const LAID_OUT_SECTIONS: ReportSectionId[] = ['summary', 'trends', ...RIGHT_RAIL_SECTIONS, 'apiDrilldown'];

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
    descriptor.sections
      .filter((sectionId) => getSectionLoader(descriptor.id, sectionId))
      .forEach((sectionId) => {
        dispatch(loadReportSection(descriptor.id, sectionId));
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

  const hasSection = (sectionId: ReportSectionId) => descriptor.sections.includes(sectionId);
  const renderSection = (sectionId: ReportSectionId) => {
    if (!hasSection(sectionId)) {
      return null;
    }
    const Section = sectionComponents[sectionId];
    return <Section key={sectionId} descriptor={descriptor} />;
  };
  const hasRail = RIGHT_RAIL_SECTIONS.some(hasSection);
  const extras = descriptor.sections.filter((sectionId) => !LAID_OUT_SECTIONS.includes(sectionId));

  return (
    <>
      <ControlsRow data-testid="reports-controls">
        <ControlField>
          <ServiceSelector />
        </ControlField>
        <ControlField $grow>
          <ReportingPeriodSelector />
        </ControlField>
      </ControlsRow>
      {hasRequiredRole(descriptor, resourceAccess) ? (
        <SectionsStack>
          {renderSection('summary')}
          {(hasSection('trends') || hasRail) && (
            <TrendsRow $hasRail={hasRail} data-testid="reports-trends-row">
              {renderSection('trends')}
              {hasRail && (
                <RightRail data-testid="reports-side-rail">
                  {RIGHT_RAIL_SECTIONS.map(renderSection)}
                </RightRail>
              )}
            </TrendsRow>
          )}
          {renderSection('apiDrilldown')}
          {extras.map(renderSection)}
        </SectionsStack>
      ) : (
        <GoabCallout heading="Role required" type="information" testId="reports-role-need-callout">
          You need the {descriptor.requiredRole} role to view this report.
        </GoabCallout>
      )}
    </>
  );
};
