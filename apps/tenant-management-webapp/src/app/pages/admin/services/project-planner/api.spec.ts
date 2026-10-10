import axios from 'axios';
import { renderHook } from '@testing-library/react';
import { useDispatch, useSelector } from 'react-redux';
import { ErrorNotification } from '@store/notifications/actions';
import { usePlannerApi } from './api';

jest.mock('axios', () => ({ __esModule: true, default: { request: jest.fn() } }));
jest.mock('react-redux', () => ({ useDispatch: jest.fn(), useSelector: jest.fn() }));
jest.mock('@store/notifications/actions', () => ({ ErrorNotification: jest.fn((payload) => ({ type: 'error', payload })) }));
jest.mock('@store/tenant/actions', () => ({ getAccessToken: jest.fn(() => ({ type: 'get-access-token' })) }));

describe('usePlannerApi', () => {
  const baseUrl = 'https://planner.adsp-uat.alberta.ca';
  const accessToken = 'access-token-1';
  const axiosRequest = axios.request as jest.Mock;
  const dispatch = jest.fn();
  const state = { config: { serviceUrls: { projectPlannerServiceApiUrl: baseUrl } } };

  const renderApi = () => renderHook(() => usePlannerApi()).result.current;

  beforeEach(() => {
    (useDispatch as jest.Mock).mockReturnValue(dispatch);
    (useSelector as jest.Mock).mockImplementation((selector) => selector(state));
    dispatch.mockResolvedValue(accessToken);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('lists solutions from the planner service', async () => {
    axiosRequest.mockResolvedValueOnce({ data: { results: [{ id: 'solution-1' }] } });

    const result = await renderApi().listSolutions();

    expect(result).toEqual([{ id: 'solution-1' }]);
  });

  it('requests up to 100 solutions using the planner api url', async () => {
    axiosRequest.mockResolvedValueOnce({ data: { results: [] } });

    await renderApi().listSolutions();

    expect(axiosRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'get', url: `${baseUrl}/planner/v1/solutions?top=100` }),
    );
  });

  it('sends the access token with each request', async () => {
    axiosRequest.mockResolvedValueOnce({ data: { results: [] } });

    await renderApi().listSolutions();

    expect(axiosRequest.mock.calls[0][0].headers.Authorization).toContain(accessToken);
  });

  it('gets a solution by id', async () => {
    axiosRequest.mockResolvedValueOnce({ data: { id: 'solution-1' } });

    const result = await renderApi().getSolution('solution-1');

    expect(result).toEqual({ id: 'solution-1' });
  });

  it('requests the solution url when getting a solution', async () => {
    axiosRequest.mockResolvedValueOnce({ data: {} });

    await renderApi().getSolution('solution-1');

    expect(axiosRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'get', url: `${baseUrl}/planner/v1/solutions/solution-1` }),
    );
  });

  it('creates a solution with name and problem statement', async () => {
    axiosRequest.mockResolvedValueOnce({ data: { id: 'solution-1' } });

    await renderApi().createSolution('Permit intake', 'Applicants submit permit forms.');

    expect(axiosRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'post',
        url: `${baseUrl}/planner/v1/solutions`,
        data: { name: 'Permit intake', problemStatement: 'Applicants submit permit forms.' },
      }),
    );
  });

  it('deletes a solution', async () => {
    axiosRequest.mockResolvedValueOnce({ data: { deleted: true } });

    await renderApi().deleteSolution('solution-1');

    expect(axiosRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'delete', url: `${baseUrl}/planner/v1/solutions/solution-1` }),
    );
  });

  it('resolves to undefined when deleting a solution', async () => {
    axiosRequest.mockResolvedValueOnce({ data: { deleted: true } });

    const result = await renderApi().deleteSolution('solution-1');

    expect(result).toBeUndefined();
  });

  it('analyzes a solution with the supplied text', async () => {
    axiosRequest.mockResolvedValueOnce({ data: { id: 'solution-1' } });

    await renderApi().analyze('solution-1', 'Inspectors record findings.');

    expect(axiosRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'post',
        url: `${baseUrl}/planner/v1/solutions/solution-1/analyze`,
        data: { text: 'Inspectors record findings.' },
      }),
    );
  });

  it('consults a specialist service', async () => {
    axiosRequest.mockResolvedValueOnce({ data: { service: 'form-service', fit: 'recommended' } });

    const result = await renderApi().consult('solution-1', 'form-service');

    expect(result).toEqual({ service: 'form-service', fit: 'recommended' });
  });

  it('posts to the consult url for the service', async () => {
    axiosRequest.mockResolvedValueOnce({ data: {} });

    await renderApi().consult('solution-1', 'form-service');

    expect(axiosRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'post',
        url: `${baseUrl}/planner/v1/solutions/solution-1/consult/form-service`,
      }),
    );
  });

  it('hands off to a specialist service', async () => {
    axiosRequest.mockResolvedValueOnce({ data: { workspacePath: '/admin/services/form' } });

    const result = await renderApi().handoff('solution-1', 'form-service');

    expect(result).toEqual({ workspacePath: '/admin/services/form' });
  });

  it('posts to the handoff url for the service', async () => {
    axiosRequest.mockResolvedValueOnce({ data: {} });

    await renderApi().handoff('solution-1', 'form-service');

    expect(axiosRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'post',
        url: `${baseUrl}/planner/v1/solutions/solution-1/handoff/form-service`,
      }),
    );
  });

  it('lists patterns', async () => {
    axiosRequest.mockResolvedValueOnce({ data: { results: [{ id: 'case-management' }] } });

    const result = await renderApi().listPatterns();

    expect(result).toEqual([{ id: 'case-management' }]);
  });

  it('dispatches an error notification using the service error message', async () => {
    axiosRequest.mockRejectedValueOnce({ response: { data: { errorMessage: 'Solution not found' } } });

    await renderApi()
      .getSolution('missing')
      .catch(() => undefined);

    expect(ErrorNotification).toHaveBeenCalledWith({ message: 'Solution not found' });
  });

  it('falls back to the error message when the response has no error message', async () => {
    axiosRequest.mockRejectedValueOnce(new Error('Network Error'));

    await renderApi()
      .getSolution('solution-1')
      .catch(() => undefined);

    expect(ErrorNotification).toHaveBeenCalledWith({ message: 'Network Error' });
  });

  it('falls back to the stringified error when it has no message', async () => {
    axiosRequest.mockRejectedValueOnce('boom');

    await renderApi()
      .getSolution('solution-1')
      .catch(() => undefined);

    expect(ErrorNotification).toHaveBeenCalledWith({ message: 'boom' });
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
