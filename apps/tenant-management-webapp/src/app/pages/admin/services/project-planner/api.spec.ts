import axios from 'axios';
import { renderHook } from '@testing-library/react';
import { useDispatch, useSelector } from 'react-redux';
import { ErrorNotification } from '@store/notifications/actions';
import { PlannerApi, usePlannerApi } from './api';

jest.mock('axios', () => ({ __esModule: true, default: { request: jest.fn() } }));
jest.mock('react-redux', () => ({ useDispatch: jest.fn(), useSelector: jest.fn() }));
jest.mock('@store/notifications/actions', () => ({ ErrorNotification: jest.fn((payload) => ({ type: 'error', payload })) }));
jest.mock('@store/tenant/actions', () => ({ getAccessToken: jest.fn(() => ({ type: 'get-access-token' })) }));

type ApiCall = (api: PlannerApi) => Promise<unknown>;

describe('usePlannerApi', () => {
  const baseUrl = 'https://planner.adsp-uat.alberta.ca';
  const accessToken = 'access-token-1';
  const axiosRequest = axios.request as jest.Mock;
  const dispatch = jest.fn();
  const state = { config: { serviceUrls: { projectPlannerServiceApiUrl: baseUrl } } };
  const responseData = { results: [{ id: 'r1' }], id: 'x' };

  const renderApi = () => renderHook(() => usePlannerApi()).result.current;

  beforeEach(() => {
    (useDispatch as jest.Mock).mockReturnValue(dispatch);
    (useSelector as jest.Mock).mockImplementation((selector) => selector(state));
    dispatch.mockResolvedValue(accessToken);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('planner endpoints', () => {
    const pattern = { name: 'P', description: 'd', domainLanguage: [], serviceMappings: [], clarifyingQuestions: [] };
    const chatBody = { message: 'hi', chatId: 'c1', intent: 'ask' as const, solutionId: 's1', mode: 'ai' as const };

    beforeEach(() => {
      axiosRequest.mockResolvedValueOnce({ data: responseData });
    });

    const expectRequest = (method: string, path: string, data?: unknown) =>
      expect(axiosRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method,
          url: `${baseUrl}/planner/v1${path}`,
          ...(data !== undefined ? { data } : {}),
        }),
      );

    it.each<[string, ApiCall, string, string]>([
      ['lists up to 100 solutions', (api) => api.listSolutions(), 'get', '/solutions?top=100'],
      ['gets a solution', (api) => api.getSolution('s1'), 'get', '/solutions/s1'],
      ['deletes a solution', (api) => api.deleteSolution('s1'), 'delete', '/solutions/s1'],
      ['gets analysis options', (api) => api.getAnalysisOptions(), 'get', '/analysis/options'],
      [
        'consults a specialist',
        (api) => api.consult('s1', 'form-service'),
        'post',
        '/solutions/s1/consult/form-service',
      ],
      ['exports a solution', (api) => api.exportSolution('s1'), 'get', '/solutions/s1/export'],
      ['lists specialists', (api) => api.listSpecialists(), 'get', '/specialists'],
      [
        'lists chats filtered by service and solution',
        (api) => api.listChats({ service: 'form-service', solutionId: 's1' }),
        'get',
        '/specialists/chats?service=form-service&solutionId=s1',
      ],
      ['lists chats without a filter', (api) => api.listChats(), 'get', '/specialists/chats'],
      ['gets a chat', (api) => api.getChat('c1'), 'get', '/specialists/chats/c1'],
      ['exports a chat', (api) => api.exportChat('c1'), 'get', '/specialists/chats/c1/export'],
      ['exports all chats', (api) => api.exportAllChats(), 'get', '/specialists/chats/export'],
      ['deletes a chat', (api) => api.deleteChat('c1'), 'delete', '/specialists/chats/c1'],
      ['lists patterns', (api) => api.listPatterns(), 'get', '/patterns'],
      ['deletes a pattern', (api) => api.deletePattern('p1'), 'delete', '/patterns/p1'],
    ])('%s', async (_name, call, method, path) => {
      await call(renderApi());

      expectRequest(method, path);
    });

    const solution = { name: 'Permit intake', problemStatement: 'Applicants submit permit forms.' };
    const discovery = { message: 'hi', mode: 'ai' as const, force: true, restart: false };
    const blueprint = { mode: 'rules' as const, refreshConsultations: true };
    const consult = { mode: 'ai' as const, question: 'Why?' };
    const analyzeOptions = { text: 'abc', mode: 'rules' as const };

    it.each<[string, ApiCall, string, string, unknown]>([
      [
        'creates a solution',
        (api) => api.createSolution(solution.name, solution.problemStatement),
        'post',
        '/solutions',
        solution,
      ],
      [
        'updates a solution',
        (api) => api.updateSolution('s1', { name: 'New' }),
        'patch',
        '/solutions/s1',
        { name: 'New' },
      ],
      ['analyzes with text', (api) => api.analyze('s1', 'abc'), 'post', '/solutions/s1/analyze', { text: 'abc' }],
      [
        'analyzes with options',
        (api) => api.analyze('s1', analyzeOptions),
        'post',
        '/solutions/s1/analyze',
        analyzeOptions,
      ],
      [
        'sends a chat message',
        (api) => api.chat('s1', 'hi', 'ai'),
        'post',
        '/solutions/s1/chat',
        { message: 'hi', mode: 'ai' },
      ],
      [
        'answers a question',
        (api) => api.answerQuestion('s1', 'q1', 'Yes'),
        'put',
        '/solutions/s1/questions/q1',
        { answer: 'Yes' },
      ],
      ['runs discovery', (api) => api.discovery('s1', discovery), 'post', '/solutions/s1/discovery', discovery],
      [
        'runs discovery with an empty body by default',
        (api) => api.discovery('s1'),
        'post',
        '/solutions/s1/discovery',
        {},
      ],
      ['generates a blueprint', (api) => api.blueprint('s1', blueprint), 'post', '/solutions/s1/blueprint', blueprint],
      [
        'consults with options',
        (api) => api.consult('s1', 'form-service', consult),
        'post',
        '/solutions/s1/consult/form-service',
        consult,
      ],
      [
        'chats with a specialist',
        (api) => api.specialistChat('form-service', chatBody),
        'post',
        '/specialists/form-service/chat',
        chatBody,
      ],
      ['creates a pattern', (api) => api.createPattern(pattern), 'post', '/patterns', pattern],
      ['updates a pattern', (api) => api.updatePattern('p1', pattern), 'put', '/patterns/p1', pattern],
    ])('%s', async (_name, call, method, path, data) => {
      await call(renderApi());

      expectRequest(method, path, data);
    });

    it.each<[string, ApiCall, unknown]>([
      ['listSolutions', (api) => api.listSolutions(), responseData.results],
      ['listSpecialists', (api) => api.listSpecialists(), responseData.results],
      ['listChats', (api) => api.listChats(), responseData.results],
      ['listPatterns', (api) => api.listPatterns(), responseData.results],
      ['getSolution', (api) => api.getSolution('s1'), responseData],
      ['consult', (api) => api.consult('s1', 'form-service'), responseData],
      ['deleteSolution', (api) => api.deleteSolution('s1'), undefined],
      ['deleteChat', (api) => api.deleteChat('c1'), undefined],
      ['deletePattern', (api) => api.deletePattern('p1'), undefined],
    ])('%s resolves to the expected result', async (_name, call, expected) => {
      expect(await call(renderApi())).toEqual(expected);
    });

    it('sends the access token with each request', async () => {
      await renderApi().listSolutions();

      expect(axiosRequest.mock.calls[0][0].headers.Authorization).toContain(accessToken);
    });
  });

  it.each([
    ['the service error message', { response: { data: { errorMessage: 'Solution not found' } } }, 'Solution not found'],
    ['the error message when the response has none', new Error('Network Error'), 'Network Error'],
    ['the stringified error when it has no message', 'boom', 'boom'],
  ])('dispatches an error notification using %s', async (_name, error, message) => {
    axiosRequest.mockRejectedValueOnce(error);

    await renderApi()
      .getSolution('s1')
      .catch(() => undefined);

    expect(ErrorNotification).toHaveBeenCalledWith({ message });
  });

  it('rethrows request failures to the caller', async () => {
    axiosRequest.mockRejectedValueOnce(new Error('Network Error'));

    await expect(renderApi().listPatterns()).rejects.toThrow('Network Error');
  });

  it('rejects when the access token cannot be retrieved', async () => {
    dispatch.mockRejectedValueOnce(new Error('token expired'));

    await expect(renderApi().listPatterns()).rejects.toThrow('token expired');
  });

  it('returns the same api instance while dependencies are unchanged', () => {
    const { result, rerender } = renderHook(() => usePlannerApi());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
