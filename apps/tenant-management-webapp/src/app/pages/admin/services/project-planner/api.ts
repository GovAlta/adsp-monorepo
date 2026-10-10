import axios from 'axios';
import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ErrorNotification } from '@store/notifications/actions';
import { getAccessToken } from '@store/tenant/actions';
import { AppDispatch, RootState } from '@store/index';
import { BusinessPattern, ConsultResult, HandoffResult, Solution } from './model';

export interface PlannerApi {
  listSolutions: () => Promise<Solution[]>;
  getSolution: (id: string) => Promise<Solution>;
  createSolution: (name: string, problemStatement: string) => Promise<Solution>;
  deleteSolution: (id: string) => Promise<void>;
  analyze: (id: string, text?: string) => Promise<Solution>;
  consult: (id: string, service: string) => Promise<ConsultResult>;
  handoff: (id: string, service: string) => Promise<HandoffResult>;
  listPatterns: () => Promise<BusinessPattern[]>;
}

/**
 * Planner API client. State is owned by the planner service (solutions persist server side),
 * so the web app keeps only view state in components rather than adding a redux slice.
 */
export function usePlannerApi(): PlannerApi {
  const dispatch = useDispatch<AppDispatch>();
  const baseUrl = useSelector((state: RootState) => state.config.serviceUrls?.projectPlannerServiceApiUrl);

  return useMemo(() => {
    const request = async <T>(method: string, path: string, data?: unknown): Promise<T> => {
      try {
        const token = await dispatch(getAccessToken());
        const { data: result } = await axios.request<T>({
          method,
          url: new URL(`/planner/v1${path}`, baseUrl).href,
          data,
          headers: { Authorization: `Bearer ${token}` },
        });
        return result;
      } catch (err) {
        dispatch(ErrorNotification({ message: err?.response?.data?.errorMessage || err?.message || String(err) }));
        throw err;
      }
    };

    return {
      listSolutions: async () => (await request<{ results: Solution[] }>('get', '/solutions?top=100')).results,
      getSolution: (id) => request<Solution>('get', `/solutions/${id}`),
      createSolution: (name, problemStatement) => request<Solution>('post', '/solutions', { name, problemStatement }),
      deleteSolution: async (id) => {
        await request('delete', `/solutions/${id}`);
      },
      analyze: (id, text) => request<Solution>('post', `/solutions/${id}/analyze`, { text }),
      consult: (id, service) => request<ConsultResult>('post', `/solutions/${id}/consult/${service}`),
      handoff: (id, service) => request<HandoffResult>('post', `/solutions/${id}/handoff/${service}`),
      listPatterns: async () => (await request<{ results: BusinessPattern[] }>('get', '/patterns')).results,
    };
  }, [dispatch, baseUrl]);
}
