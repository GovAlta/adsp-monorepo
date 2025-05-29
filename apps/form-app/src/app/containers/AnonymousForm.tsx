import { Container, Grid, GridItem, Recaptcha } from '@core-services/app-common';
import { FunctionComponent, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DraftFormWrapper } from '../components/DraftFormWrapper';
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
  formActions,
} from '../state';
import { createDefaultAjv } from '@abgov/jsonforms-components';
import { commonV1JsonSchema, standardV1JsonSchema } from '@abgov/data-exchange-standard';

interface FormProps {
  className?: string;
}
const ajv = createDefaultAjv(standardV1JsonSchema, commonV1JsonSchema);

const AnonymousFormComponent: FunctionComponent<FormProps> = ({ className }) => {
  const dispatch = useDispatch<AppDispatch>();

  const [emptyData, _] = useState({});
  const [initialLoad, setInitialLoad] = useState<boolean>(true);

  const recaptchaKey = useSelector((state: AppState) => state.config.environment.recaptchaKey);
  const { definition } = useSelector(definitionSelector);
  const form = useSelector(formSelector);
  const data = useSelector(dataSelector);
  const files = useSelector(filesSelector);
  const busy = useSelector(busySelector);
  const canSubmit = useSelector(canSubmitSelector);
  const showSubmit = useSelector(showSubmitSelector);

  useEffect(() => {
    if (emptyData) {
      ajv.validate(definition.dataSchema, data);
      dispatch(updateForm({ data: data }));
      setInitialLoad(false);
    }
    //eslint-disable-next-line
  }, []);

  return (
    <div key={`anonymous-${definition?.id}`}>
      <div className={className}>
        <Container vs={1} hs={1}>
          {definition?.anonymousApply ? (
            <>
              {form?.status === 'Submitted' && <SubmittedForm definition={definition} form={form} data={data} />}
              {!form && (
                <DraftFormWrapper
                  definition={definition}
                  form={form}
                  data={initialLoad ? emptyData : data}
                  canSubmit={canSubmit}
                  showSubmit={showSubmit}
                  saving={busy.saving}
                  anonymousApply={definition.anonymousApply}
                  submitting={busy.submitting}
                  onChange={function ({ data, errors }: { data: unknown; errors?: ValidationError[] }) {
                    dispatch(updateForm({ data: data as Record<string, unknown>, files, errors: errors }));
                  }}
                  onSave={({ data, errors }) => {
                    dispatch(updateForm({ data: data as Record<string, unknown>, files, errors: errors }));
                  }}
                  onSubmit={function () {
                    dispatch(submitAnonymousForm());
                  }}
                />
              )}
            </>
          ) : (
            <Navigate to=".." />
          )}
          <Grid>
            <GridItem md={1} />
            <GridItem md={10}>
              <Recaptcha siteKey={recaptchaKey} showBranding={true} />
            </GridItem>
            <GridItem md={1} />
          </Grid>
        </Container>
      </div>
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
    position: relative;
    flex-grow: 1;
    flex-shrink: 1;
    flex-basis: 70%;
    overflow: auto;
    padding-bottom: var(--goa-space-2xl);
  }
`;
