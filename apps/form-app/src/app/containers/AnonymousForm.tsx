import { Container, Recaptcha } from '@core-services/app-common';
import { FunctionComponent } from 'react';
import { Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DraftForm } from '../components/DraftForm';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { SubmittedForm } from '../components/SubmittedForm';
import {
  ValidationError,
  AppDispatch,
  busySelector,
  canSubmitSelector,
  dataSelector,
  definitionSelector,
  filesSelector,
  formSelector,
  showSubmitSelector,
  updateForm,
  submitAnonymousForm,
  AppState,
} from '../state';

export const AnonymousForm: FunctionComponent = () => {
  const dispatch = useDispatch<AppDispatch>();

  const recaptchaKey = useSelector((state: AppState) => state.config.environment.recaptchaKey);
  const { definition, initialized } = useSelector(definitionSelector);
  const form = useSelector(formSelector);
  const data = useSelector(dataSelector);
  const files = useSelector(filesSelector);
  const busy = useSelector(busySelector);
  const canSubmit = useSelector(canSubmitSelector);
  const showSubmit = useSelector(showSubmitSelector);

  return (
    <div key={`anonymous-${definition?.id}`}>
      <LoadingIndicator isLoading={!initialized} />
      <Container vs={3} hs={1}>
        {initialized &&
          (definition?.anonymousApply ? (
            <>
              {form?.status === 'submitted' && <SubmittedForm definition={definition} form={form} data={data} />}
              {!form && (
                <DraftForm
                  definition={definition}
                  form={form}
                  data={data}
                  canSubmit={canSubmit}
                  showSubmit={showSubmit}
                  saving={busy.saving}
                  submitting={busy.submitting}
                  onChange={function ({ data, errors }: { data: unknown; errors?: ValidationError[] }) {
                    dispatch(updateForm({ data: data as Record<string, unknown>, files, errors }));
                  }}
                  onSubmit={function () {
                    dispatch(submitAnonymousForm());
                  }}
                />
              )}
            </>
          ) : (
            <Navigate to=".." />
          ))}
      </Container>
      <Recaptcha siteKey={recaptchaKey} />
    </div>
  );
};
