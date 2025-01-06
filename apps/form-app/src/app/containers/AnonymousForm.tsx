import { Container, Recaptcha } from '@core-services/app-common';
import { FunctionComponent } from 'react';
import { standardV1JsonSchema, commonV1JsonSchema } from '@abgov/data-exchange-standard';
import { Navigate } from 'react-router-dom';
import { createDefaultAjv } from '@abgov/jsonforms-components';
import { useDispatch, useSelector } from 'react-redux';
import { DraftFormWrapper } from '../components/DraftFormWrapper';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { SubmittedForm } from '../components/SubmittedForm';
import styled from 'styled-components';
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

interface FormProps {
  className?: string;
}

const AnonymousFormComponent: FunctionComponent<FormProps> = ({ className }) => {
  const dispatch = useDispatch<AppDispatch>();

  const recaptchaKey = useSelector((state: AppState) => state.config.environment.recaptchaKey);
  const { definition, initialized } = useSelector(definitionSelector);
  const form = useSelector(formSelector);
  const data = useSelector(dataSelector);
  const files = useSelector(filesSelector);
  const busy = useSelector(busySelector);
  const canSubmit = useSelector(canSubmitSelector);
  const showSubmit = useSelector(showSubmitSelector);

  const ajv = createDefaultAjv(standardV1JsonSchema, commonV1JsonSchema);

  return (
    <div key={`anonymous-${definition?.id}`}>
      <LoadingIndicator isLoading={!initialized} />
      <div className={className}>
        <Container vs={1} hs={1}>
          {initialized &&
            (definition?.anonymousApply ? (
              <>
                {form?.status === 'submitted' && <SubmittedForm definition={definition} form={form} data={data} />}
                {!form && (
                  <DraftFormWrapper
                    definition={definition}
                    form={form}
                    data={data}
                    canSubmit={canSubmit}
                    showSubmit={showSubmit}
                    saving={busy.saving}
                    anonymousApply={definition?.anonymousApply}
                    submitting={busy.submitting}
                    onChange={function ({ data, errors }: { data: unknown; errors?: ValidationError[] }) {
                      // seems to be causing infinite loop in some cases - need to look into it before going this route
                      // errors.push(...(ajv?.errors || []));
                      //  const combinedErrors = errors.concat(ajv?.errors).filter((x) => x !== null);
                      dispatch(updateForm({ data: data as Record<string, unknown>, files, errors: errors }));
                    }}
                    onSubmit={function () {
                      dispatch(submitAnonymousForm());
                    }}
                    ajv={ajv}
                  />
                )}
              </>
            ) : (
              <Navigate to=".." />
            ))}
        </Container>
      </div>
      <Recaptcha siteKey={recaptchaKey} />
    </div>
  );
};
export const AnonymousForm = styled(AnonymousFormComponent)`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: row-reverse;

  @media (max-width: 639px) {
    flex-direction: column;
  }

  > :first-child {
    flex-grow: 1;
    flex-shrink: 1;
    flex-basis: 70%;
    overflow: auto;
    padding-bottom: var(--goa-space-2xl);
  }
`;
