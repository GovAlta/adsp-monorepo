import axios from 'axios';
import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ErrorNotification } from '@store/notifications/actions';
import { getAccessToken } from '@store/tenant/actions';
import { AppDispatch, RootState } from '@store/index';
import {
  AnalysisOptions,
  AnalyzeOptions,
  BlueprintOptions,
  BusinessPattern,
  ChatCriteria,
  ChatSummary,
  ComponentReview,
  ConsultOptions,
  ConsultResult,
  DiscoveryOptions,
  PatternInput,
  Solution,
  SolutionUpdate,
  SolutionVersionList,
  SolutionVersionSummary,
  SpecialistChat,
  SpecialistChatExport,
  SpecialistChatRequest,
  SpecialistChatResponse,
  SpecialistDefinition,
  AnalysisMode,
} from './model';

export interface PlannerApi {
  listSolutions: () => Promise<Solution[]>;
  getSolution: (id: string) => Promise<Solution>;
  createSolution: (name: string, problemStatement: string) => Promise<Solution>;
  extractProblemStatement: (file: File) => Promise<{ text: string }>;
  deleteSolution: (id: string) => Promise<void>;
  updateSolution: (id: string, update: SolutionUpdate) => Promise<Solution>;
  /** Accepts the problem text directly (legacy) or options with text and mode. */
  analyze: (id: string, textOrOptions?: string | AnalyzeOptions) => Promise<Solution>;
  getAnalysisOptions: () => Promise<AnalysisOptions>;
  chat: (id: string, message: string, mode?: AnalysisMode) => Promise<Solution>;
  answerQuestion: (id: string, questionId: string, answer: string) => Promise<Solution>;
  reviewComponent: (id: string, order: number, review: ComponentReview) => Promise<Solution>;
  discovery: (id: string, options?: DiscoveryOptions) => Promise<Solution>;
  blueprint: (id: string, options?: BlueprintOptions) => Promise<Solution>;
  consult: (id: string, service: string, options?: ConsultOptions) => Promise<ConsultResult & { solution?: Solution }>;
  exportSolution: (id: string) => Promise<unknown>;
  listVersions: (id: string) => Promise<SolutionVersionList>;
  saveVersion: (id: string) => Promise<SolutionVersionSummary>;
  renameVersion: (id: string, number: number, name: string) => Promise<SolutionVersionSummary>;
  exportVersion: (id: string, number: number) => Promise<unknown>;
  listSpecialists: () => Promise<SpecialistDefinition[]>;
  specialistChat: (service: string, request: SpecialistChatRequest) => Promise<SpecialistChatResponse>;
  listChats: (criteria?: ChatCriteria) => Promise<ChatSummary[]>;
  getChat: (id: string) => Promise<SpecialistChat>;
  exportChat: (id: string) => Promise<unknown>;
  exportAllChats: (criteria?: ChatCriteria) => Promise<SpecialistChatExport>;
  deleteChat: (id: string) => Promise<void>;
  listPatterns: () => Promise<BusinessPattern[]>;
  createPattern: (pattern: PatternInput) => Promise<BusinessPattern>;
  updatePattern: (id: string, pattern: PatternInput) => Promise<BusinessPattern>;
  deletePattern: (id: string) => Promise<void>;
}

const chatQuery = (criteria?: ChatCriteria) => {
  const params = new URLSearchParams();
  if (criteria?.service) params.set('service', criteria.service);
  if (criteria?.solutionId) params.set('solutionId', criteria.solutionId);
  const query = params.toString();
  return query ? `?${query}` : '';
};

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

    const requestFile = async <T>(path: string, file: File): Promise<T> => {
      try {
        const token = await dispatch(getAccessToken());
        const form = new FormData();
        form.append('file', file, file.name);
        const { data: result } = await axios.request<T>({
          method: 'post',
          url: new URL(`/planner/v1${path}`, baseUrl).href,
          data: form,
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
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
      extractProblemStatement: (file) => requestFile<{ text: string }>('/documents/extract', file),
      deleteSolution: async (id) => {
        await request('delete', `/solutions/${id}`);
      },
      updateSolution: (id, update) => request<Solution>('patch', `/solutions/${id}`, update),
      analyze: (id, textOrOptions) =>
        request<Solution>(
          'post',
          `/solutions/${id}/analyze`,
          typeof textOrOptions === 'object' ? textOrOptions : { text: textOrOptions },
        ),
      getAnalysisOptions: () => request<AnalysisOptions>('get', '/analysis/options'),
      chat: (id, message, mode) => request<Solution>('post', `/solutions/${id}/chat`, { message, mode }),
      answerQuestion: (id, questionId, answer) =>
        request<Solution>('put', `/solutions/${id}/questions/${questionId}`, { answer }),
      reviewComponent: (id, order, review) =>
        request<Solution>('put', `/solutions/${id}/components/${order}/review`, { review }),
      discovery: (id, options = {}) => request<Solution>('post', `/solutions/${id}/discovery`, options),
      blueprint: (id, options = {}) => request<Solution>('post', `/solutions/${id}/blueprint`, options),
      consult: (id, service, options) =>
        request<ConsultResult & { solution?: Solution }>('post', `/solutions/${id}/consult/${service}`, options),
      exportSolution: (id) => request<unknown>('get', `/solutions/${id}/export`),
      listVersions: (id) => request<SolutionVersionList>('get', `/solutions/${id}/versions`),
      saveVersion: (id) => request<SolutionVersionSummary>('post', `/solutions/${id}/versions`),
      renameVersion: (id, number, name) =>
        request<SolutionVersionSummary>('patch', `/solutions/${id}/versions/${number}`, { name }),
      exportVersion: (id, number) => request<unknown>('get', `/solutions/${id}/versions/${number}/export`),
      listSpecialists: async () => (await request<{ results: SpecialistDefinition[] }>('get', '/specialists')).results,
      specialistChat: (service, body) => request<SpecialistChatResponse>('post', `/specialists/${service}/chat`, body),
      listChats: async (criteria) =>
        (await request<{ results: ChatSummary[] }>('get', `/specialists/chats${chatQuery(criteria)}`)).results,
      getChat: (id) => request<SpecialistChat>('get', `/specialists/chats/${id}`),
      exportChat: (id) => request<unknown>('get', `/specialists/chats/${id}/export`),
      exportAllChats: (criteria) =>
        request<SpecialistChatExport>('get', `/specialists/chats/export${chatQuery(criteria)}`),
      deleteChat: async (id) => {
        await request('delete', `/specialists/chats/${id}`);
      },
      listPatterns: async () => (await request<{ results: BusinessPattern[] }>('get', '/patterns')).results,
      createPattern: (pattern) => request<BusinessPattern>('post', '/patterns', pattern),
      updatePattern: (id, pattern) => request<BusinessPattern>('put', `/patterns/${id}`, pattern),
      deletePattern: async (id) => {
        await request('delete', `/patterns/${id}`);
      },
    };
  }, [dispatch, baseUrl]);
}
