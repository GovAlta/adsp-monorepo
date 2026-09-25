import axios from 'axios';
import * as HttpStatusCodes from 'http-status-codes';
import { ReportSectionId, SectionLoader } from './types';

/**
 * Placeholder reporting endpoint, served by tenant-management-gateway.
 * THIS CONSTANT IS THE ONLY THING TO CHANGE when the real API lands.
 */
export const REPORTS_API_BASE = '/api/tenant/v1/reports';

interface ReportSectionResponse<T> {
  serviceId: string;
  sectionId: ReportSectionId;
  period: { from: string; to: string };
  data: T | null;
}

const isGatewaySectionNotFound = (err: unknown): boolean => {
  if (!axios.isAxiosError(err) || err.response?.status !== HttpStatusCodes.NOT_FOUND) {
    return false;
  }
  const data = err.response.data as { error?: unknown; errorMessage?: unknown } | string | undefined;
  return (
    typeof data === 'object' &&
    data !== null &&
    (typeof data.error === 'string' || typeof data.errorMessage === 'string')
  );
};

/** Builds a loader for one section. Section tickets call this instead of writing axios code. */
export const createReportSectionLoader =
  <T>(sectionId: ReportSectionId): SectionLoader<T | null> =>
  async ({ descriptor, period, token }) => {
    try {
      const { data } = await axios.get<ReportSectionResponse<T>>(
        `${REPORTS_API_BASE}/${descriptor.id}/${sectionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { from: period.from, to: period.to, preset: period.preset },
        }
      );
      return data?.data ?? null;
    } catch (err) {
      // Gateway JSON 404 = this service does not offer the section (empty, not an error).
      // HTML/proxy 404s are real failures and must not look like "no data".
      if (axios.isAxiosError(err) && isGatewaySectionNotFound(err)) {
        return null;
      }
      throw err;
    }
  };
