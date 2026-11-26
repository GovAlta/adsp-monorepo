import { GoARenderers, createDefaultAjv } from '@abgov/jsonforms-components';
import { GoabButton, GoabButtonGroup, GoabCallout } from '@abgov/react-components';
import { Band, Container, Grid, GridItem } from '@core-services/app-common';
import { JsonSchema } from '@jsonforms/core';
import { JsonForms } from '@jsonforms/react';
import { ErrorObject } from 'ajv';
import { DateTime } from 'luxon';
import { FunctionComponent, ReactNode, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import {
  AccessRequestForm,
  AppDispatch,
  AppState,
  ValidationError,
  accessRequestActions,
  accessRequestSelector,
  loadAccessRequest,
  logoutUser,
  submitAccessRequest,
  tenantSelector,
  userSelector,
} from '../state';
import { FormDoesNotExist } from '../components/FormDoesNotExist';
import { LoadingIndicator } from '../components/LoadingIndicator';

const ajv = createDefaultAjv();

type Properties = Record<string, { type?: string; const?: unknown }>;

// The form editor saves a required checkbox as a boolean that must be true. JsonForms draws a const as a dropdown, so
// the questions are drawn without the const and the page checks the tick itself; form service still validates it.
const toDisplayedSchema = (schema: JsonSchema): JsonSchema => {
  const properties = Object.fromEntries(
    Object.entries((schema?.properties || {}) as Properties).map(([name, property]) => {
      if (property?.type !== 'boolean' || !('const' in property)) {
        return [name, property];
      }
      const { const: _mustBe, ...checkbox } = property;
      return [name, checkbox];
    }),
  );
  return { ...schema, properties } as JsonSchema;
};

// A required checkbox that was ticked and then unticked is false rather than missing, so it passes "required".
const untickedErrors = (schema: JsonSchema, data: Record<string, unknown>): ErrorObject[] =>
  Object.entries((schema?.properties || {}) as Properties)
    .filter(([name, property]) => property?.type === 'boolean' && property.const === true && data[name] === false)
    .map(([name]) => ({
      instancePath: `/${name}`,
      schemaPath: `#/properties/${name}/const`,
      keyword: 'const',
      params: { allowedValue: true },
      message: 'must be checked',
    }));

// The question controls only show their errors once visited, so a blocked submit also lists the questions to fix.
const questionsToFix = (form: AccessRequestForm, errors: ErrorObject[]): string[] => {
  const controls = ((form.uiSchema as { elements?: { scope?: string; label?: string }[] })?.elements || []).filter(
    ({ scope }) => scope?.startsWith('#/properties/'),
  );
  const names = errors.map((error) =>
    error.keyword === 'required' ? String(error.params?.missingProperty) : error.instancePath.split('/')[1],
  );
  return [...new Set(names.filter(Boolean))].map(
    (name) =>
      controls.find(({ scope }) => scope === `#/properties/${name}`)?.label ||
      ((form.dataSchema?.properties?.[name] as { title?: string })?.title ?? name),
  );
};

const Applicant = styled.p`
  margin-bottom: var(--goa-space-l);
`;

interface AccessRequestProps {
  definitionId: string;
}

const useAccessRequest = (definitionId: string) => {
  const dispatch = useDispatch<AppDispatch>();
  const accessRequest = useSelector((state: AppState) => accessRequestSelector(state, definitionId));

  useEffect(() => {
    if (!accessRequest.initialized) {
      dispatch(loadAccessRequest(definitionId));
    }
  }, [dispatch, definitionId, accessRequest.initialized]);

  return accessRequest;
};

const Layout: FunctionComponent<{ title: string; intro: ReactNode; children?: ReactNode }> = ({
  title,
  intro,
  children,
}) => (
  <div>
    <Band title={title}>{intro}</Band>
    <Container vs={3} hs={1}>
      <Grid>
        <GridItem md={1} />
        <GridItem md={10}>{children}</GridItem>
        <GridItem md={1} />
      </Grid>
    </Container>
  </div>
);

// Shown at the form's own address when the signed-in user can't open it: sends them on to request access if the
// form accepts access requests, otherwise says the form doesn't exist, as before.
export const RestrictedForm: FunctionComponent<AccessRequestProps> = ({ definitionId }) => {
  const { tenant } = useParams();
  const { initialized, form } = useAccessRequest(definitionId);

  if (!initialized) {
    return <LoadingIndicator isLoading={true} />;
  }
  return form ? <Navigate to={`/${tenant}/${definitionId}/access-request`} replace /> : <FormDoesNotExist />;
};

export const AccessRequest: FunctionComponent<AccessRequestProps> = ({ definitionId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const tenant = useSelector(tenantSelector);
  const { user } = useSelector(userSelector);
  const { initialized, form, request, submitting, submitError } = useAccessRequest(definitionId);

  const [data, setData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<ValidationError[]>([]);
  // Errors are shown once the user tries to submit, not while they are still filling in the questions.
  const [showErrors, setShowErrors] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const displayedSchema = useMemo(() => toDisplayedSchema(form?.dataSchema), [form?.dataSchema]);
  const tickErrors = useMemo(() => untickedErrors(form?.dataSchema, data), [form?.dataSchema, data]);

  if (!initialized) {
    return <LoadingIndicator isLoading={true} />;
  }

  if (!form) {
    return <FormDoesNotExist />;
  }

  if (request?.status === 'pending') {
    return (
      <Layout title={`Request access to ${form.name}`} intro="This form is only available to approved users.">
        <GoabCallout
          type={submitted ? 'success' : 'information'}
          heading={submitted ? 'Request submitted' : 'Request waiting for review'}
          testId="access-request-pending"
        >
          Your request for access was submitted on{' '}
          {DateTime.fromISO(request.submittedAt).toLocaleString(DateTime.DATETIME_MED)} and is waiting for review. You
          can't use the form until an administrator approves the request.
        </GoabCallout>
      </Layout>
    );
  }

  if (request?.status === 'approved') {
    return (
      <Layout title={`Request access to ${form.name}`} intro="This form is only available to approved users.">
        <GoabCallout type="success" heading="Request approved" testId="access-request-approved">
          Your request for access was approved. Sign out and sign in again to open the form. If you still can't open it,
          contact the administrator of the form.
        </GoabCallout>
        <GoabButtonGroup alignment="end">
          <GoabButton
            type="primary"
            testId="access-request-sign-out"
            onClick={() => dispatch(logoutUser({ tenant, from: `/${tenant.name}/${definitionId}` }))}
          >
            Sign out
          </GoabButton>
        </GoabButtonGroup>
      </Layout>
    );
  }

  const onCancel = () => {
    dispatch(accessRequestActions.clearSubmitError());
    setData({});
    setShowErrors(false);
    setCancelled(true);
  };

  if (cancelled) {
    return (
      <Layout title={`Request access to ${form.name}`} intro="This form is only available to approved users.">
        <GoabCallout type="information" heading="Request cancelled" testId="access-request-cancelled">
          You didn't request access, so you can't use the form yet.
        </GoabCallout>
        <GoabButtonGroup alignment="end">
          <GoabButton type="primary" testId="access-request-restart" onClick={() => setCancelled(false)}>
            Request access
          </GoabButton>
        </GoabButtonGroup>
      </Layout>
    );
  }

  const onSubmit = async () => {
    setShowErrors(true);
    if (errors.length > 0 || tickErrors.length > 0) {
      return;
    }
    const { payload } = await dispatch(submitAccessRequest({ definitionId, data }));
    if ((payload as { request?: unknown })?.request) {
      setSubmitted(true);
    }
  };

  const hasQuestions = Object.keys((form.dataSchema?.properties as object) || {}).length > 0;
  const toFix = showErrors ? questionsToFix(form, [...(errors as ErrorObject[]), ...tickErrors]) : [];

  return (
    <Layout
      title={`Request access to ${form.name}`}
      intro="This form is only available to approved users. Request access, and an administrator will review your request."
    >
      {request?.status === 'denied' && (
        <GoabCallout type="important" heading="Your previous request wasn't approved" testId="access-request-denied">
          You can submit a new request.
        </GoabCallout>
      )}
      <Applicant data-testid="access-request-applicant">
        Requesting access as <b>{user?.name}</b> ({user?.email}).
      </Applicant>
      {hasQuestions && (
        <JsonForms
          schema={displayedSchema}
          uischema={form.uiSchema}
          data={data}
          ajv={ajv}
          renderers={GoARenderers}
          readonly={submitting}
          validationMode={showErrors ? 'ValidateAndShow' : 'ValidateAndHide'}
          additionalErrors={showErrors ? tickErrors : []}
          onChange={({ data, errors }) => {
            setData(data);
            setErrors(errors || []);
          }}
        />
      )}
      {toFix.length > 0 && (
        <GoabCallout type="emergency" heading="Some answers are missing" testId="access-request-invalid">
          Answer these questions before you submit: {toFix.join(', ')}.
        </GoabCallout>
      )}
      {submitError && (
        <GoabCallout type="emergency" heading="Your request wasn't submitted" testId="access-request-error">
          {submitError} Your answers are still here, so you can try again.
        </GoabCallout>
      )}
      <GoabButtonGroup alignment="end" mt="l">
        <GoabButton type="secondary" disabled={submitting} testId="access-request-cancel" onClick={onCancel}>
          Cancel
        </GoabButton>
        <GoabButton type="primary" disabled={submitting} testId="access-request-submit" onClick={onSubmit}>
          {submitting ? 'Submitting...' : 'Submit request'}
        </GoabButton>
      </GoabButtonGroup>
    </Layout>
  );
};
