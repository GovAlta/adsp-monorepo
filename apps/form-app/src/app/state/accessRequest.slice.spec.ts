import axios from 'axios';
import {
  AccessRequestState,
  accessRequestActions,
  accessRequestReducer,
  accessRequestSelector,
  loadAccessRequest,
  submitAccessRequest,
  toApplicantName,
} from './accessRequest.slice';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

const FORM_SERVICE_URL = 'https://form-service';
const DEFINITION_ID = 'medical-intake';
const FORM = {
  definitionId: DEFINITION_ID,
  name: 'Medical intake',
  dataSchema: { type: 'object', properties: { profession: { type: 'string' } }, required: ['profession'] },
  uiSchema: { type: 'VerticalLayout', elements: [] },
};
const PENDING = { id: 'request-1', status: 'pending', submittedAt: '2026-11-25T16:00:00Z' };

const initialState = accessRequestReducer(undefined, { type: 'unknown' });

const user = { id: 'user-1', name: 'Test User', firstName: 'Test', lastName: 'User', email: 'Test.User@gov.ab.ca' };

const getState =
  (accessRequest: AccessRequestState = initialState, currentUser: unknown = user) =>
  () =>
    ({
      config: { directory: { 'urn:ads:platform:form-service': FORM_SERVICE_URL } },
      user: { user: currentUser },
      accessRequest,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

const axiosError = (status: number, errorMessage?: string) => ({
  isAxiosError: true,
  message: `Request failed with status code ${status}`,
  response: { status, data: errorMessage ? { errorMessage } : {} },
});

describe('access request slice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axiosMock.isAxiosError.mockImplementation((err) => !!(err as { isAxiosError?: boolean })?.isAxiosError);
  });

  describe('loadAccessRequest', () => {
    it('loads the questions and the latest request of the user', async () => {
      axiosMock.get.mockResolvedValueOnce({ data: FORM }).mockResolvedValueOnce({ data: PENDING });

      const action = await loadAccessRequest(DEFINITION_ID)(jest.fn(), getState(), undefined);

      expect(axiosMock.get).toHaveBeenNthCalledWith(
        1,
        `${FORM_SERVICE_URL}/form/v1/definitions/${DEFINITION_ID}/registration`,
        expect.any(Object),
      );
      expect(axiosMock.get).toHaveBeenNthCalledWith(
        2,
        `${FORM_SERVICE_URL}/form/v1/definitions/${DEFINITION_ID}/access-requests/Test.User%40gov.ab.ca`,
        expect.any(Object),
      );
      expect(action.payload).toEqual({ form: FORM, request: PENDING });
    });

    it('returns no request when the user has not requested access before', async () => {
      axiosMock.get.mockResolvedValueOnce({ data: FORM }).mockRejectedValueOnce(axiosError(404));

      const action = await loadAccessRequest(DEFINITION_ID)(jest.fn(), getState(), undefined);

      expect(action.payload).toEqual({ form: FORM, request: null });
    });

    it.each([403, 404])('returns no form when form service responds %s', async (status) => {
      axiosMock.get.mockRejectedValueOnce(axiosError(status));

      const action = await loadAccessRequest(DEFINITION_ID)(jest.fn(), getState(), undefined);

      expect(action.type).toBe(loadAccessRequest.fulfilled.type);
      expect(action.payload).toEqual({ form: null, request: null });
    });

    it('rejects on other errors, and the form is treated as unavailable', async () => {
      axiosMock.get.mockRejectedValueOnce(axiosError(500, 'Something broke'));

      const action = await loadAccessRequest(DEFINITION_ID)(jest.fn(), getState(), undefined);

      expect(action.type).toBe(loadAccessRequest.rejected.type);
      expect(action.payload).toEqual({ status: 500, message: 'Something broke' });
      const state = accessRequestReducer(initialState, action);
      expect(accessRequestSelector({ accessRequest: state } as never, DEFINITION_ID)).toMatchObject({
        initialized: true,
        form: null,
      });
    });
  });

  describe('submitAccessRequest', () => {
    const data = { profession: 'nurse' };

    it('submits the answers with the name and email address of the user', async () => {
      axiosMock.post.mockResolvedValueOnce({ data: PENDING });

      const action = await submitAccessRequest({ definitionId: DEFINITION_ID, data })(
        jest.fn(),
        getState(),
        undefined,
      );

      expect(axiosMock.post).toHaveBeenCalledWith(
        `${FORM_SERVICE_URL}/form/v1/definitions/${DEFINITION_ID}/access-requests`,
        { firstName: 'Test', lastName: 'User', email: 'Test.User@gov.ab.ca', data },
        expect.any(Object),
      );
      const state = accessRequestReducer(initialState, action);
      expect(state.requests[DEFINITION_ID]).toEqual(PENDING);
      expect(state.busy.submitting).toBe(false);
    });

    it('keeps the error for the page instead of rejecting', async () => {
      axiosMock.post.mockRejectedValueOnce(axiosError(400, 'access request data is invalid.'));

      const action = await submitAccessRequest({ definitionId: DEFINITION_ID, data })(
        jest.fn(),
        getState(),
        undefined,
      );

      expect(action.type).toBe(submitAccessRequest.fulfilled.type);
      const state = accessRequestReducer(initialState, action);
      expect(state.submitError).toBe('access request data is invalid.');
      expect(state.requests[DEFINITION_ID]).toBeUndefined();
    });

    it('shows the existing pending request when one was already submitted', async () => {
      axiosMock.post.mockRejectedValueOnce(axiosError(409));
      axiosMock.get.mockResolvedValueOnce({ data: PENDING });

      const action = await submitAccessRequest({ definitionId: DEFINITION_ID, data })(
        jest.fn(),
        getState(),
        undefined,
      );

      expect(action.payload).toEqual({ request: PENDING });
    });

    it('does not submit again while a request is being submitted', async () => {
      const submitting = { ...initialState, busy: { ...initialState.busy, submitting: true } };

      await submitAccessRequest({ definitionId: DEFINITION_ID, data })(jest.fn(), getState(submitting), undefined);

      expect(axiosMock.post).not.toHaveBeenCalled();
    });

    it('marks the request as submitting and clears the previous error', () => {
      const failed = accessRequestReducer(initialState, {
        type: submitAccessRequest.fulfilled.type,
        payload: { error: 'failed' },
        meta: { arg: { definitionId: DEFINITION_ID } },
      });

      const state = accessRequestReducer(failed, { type: submitAccessRequest.pending.type });

      expect(state.busy.submitting).toBe(true);
      expect(state.submitError).toBeNull();
      expect(accessRequestReducer(failed, accessRequestActions.clearSubmitError()).submitError).toBeNull();
    });
  });

  describe('toApplicantName', () => {
    it('uses the given and family names of the token', () => {
      expect(toApplicantName({ ...user, name: 'Someone Else' } as never)).toEqual({
        firstName: 'Test',
        lastName: 'User',
      });
    });

    it('splits the display name when the token has no given or family name', () => {
      expect(toApplicantName({ name: 'Mary Ann Smith' } as never)).toEqual({
        firstName: 'Mary',
        lastName: 'Ann Smith',
      });
    });
  });
});
