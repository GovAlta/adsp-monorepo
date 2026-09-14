import axios from 'axios';
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
      // A section with no data source yet is an empty state, not a failure.
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  };
