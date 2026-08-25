// clean-code-ignore: RULE-19 — covered by ./JsonformsExternalNavigation.spec.tsx.
//
// External form navigation demo. The form lives in form-app, a separate application, so every link
// on this page is an ordinary URL — nothing here reads or writes the form's internal page state.
//
// Nothing about the form is hardcoded beyond its name:
//
//   what you can link to  — page ids and field scopes come from getNavigationTargets(uiSchema),
//                           which is how a host discovers what it is allowed to link to.
//   where the form lives  — form-app's address comes from the service directory, the tenant from
//                           the route, so the links work in whatever environment this runs in.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { GoabButton, GoabButtonGroup, GoabCallout, GoabContainer, GoabText } from '@abgov/react-components';
import {
  ContextProviderFactory,
  createDefaultAjv,
  getExternalFormPath,
  getNavigationTargets,
  GoACells,
  GoAReviewRenderers,
  ReviewRenderProvider,
} from '@abgov/jsonforms-components';
import { JsonForms } from '@jsonforms/react';
import {
  AppDispatch,
  AppState,
  createDefinitionFromTemplate,
  createForm,
  definitionFormsSelector,
  directorySelector,
  findUserForms,
  loadDefinition,
  loadFormData,
} from '../../../state';
import { ServiceContainer } from '../../styled-components';
import { LoadingIndicator } from '../../LoadingIndicator';
import {
  EXTERNAL_NAVIGATION_APPLICANT_ROLES,
  EXTERNAL_NAVIGATION_DEFINITION_DESCRIPTION,
  EXTERNAL_NAVIGATION_DEFINITION_ID,
  EXTERNAL_NAVIGATION_DEFINITION_NAME,
  externalNavigationDataSchema,
  externalNavigationUiSchema,
} from './externalNavigationDefinition';

const FORM_APP_ID = 'urn:ads:platform:form-app';

const ContextProvider = ContextProviderFactory();

// Scope pointers are addresses, not copy. Derive something readable for the button face only.
export const fieldLabel = (scope: string) => {
  const property = scope.split('/').filter(Boolean).pop() ?? scope;
  return property.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
};

const openDemoLink = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

export const JsonformsExternalNavigation = (): JSX.Element => {
  const dispatch = useDispatch<AppDispatch>();
  const { tenant: tenantName } = useParams<{ tenant: string }>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>();
  const ajv = useMemo(() => createDefaultAjv(), []);

  const directory = useSelector(directorySelector);
  // Undefined until the lookup has run; null once form-service has answered 404.
  const definition = useSelector((state: AppState) => state.form.definitions[EXTERNAL_NAVIGATION_DEFINITION_ID]);
  const formsInitialized = useSelector((state: AppState) => state.form.initialized.forms);
  const { forms } = useSelector((state: AppState) => definitionFormsSelector(state, EXTERNAL_NAVIGATION_DEFINITION_ID));

  const formAppHost = directory[FORM_APP_ID];
  const draft = forms[0];
  const formUrl =
    formAppHost && draft ? `${formAppHost}/${tenantName}/${EXTERNAL_NAVIGATION_DEFINITION_ID}/${draft.id}` : '';

  // Discovery needs the uischema and nothing else — no form data, no rendered form.
  const navigationTargets = useMemo(
    () => (definition?.uiSchema ? getNavigationTargets(definition.uiSchema) : []),
    [definition],
  );

  useEffect(() => {
    if (definition === undefined) {
      dispatch(loadDefinition(EXTERNAL_NAVIGATION_DEFINITION_ID));
    }
  }, [definition, dispatch]);

  useEffect(() => {
    if (definition && !formsInitialized) {
      dispatch(findUserForms({ definitionId: EXTERNAL_NAVIGATION_DEFINITION_ID }));
    }
  }, [definition, formsInitialized, dispatch]);

  useEffect(() => {
    if (draft?.id && formData === undefined) {
      dispatch(loadFormData(draft.id))
        .unwrap()
        .then(setFormData)
        .catch(() => setFormData({}));
    }
  }, [draft?.id, formData, dispatch]);

  const openExternalPath = useCallback(
    (stepId?: number, scope?: string) => {
      const path = definition?.uiSchema && getExternalFormPath(definition.uiSchema, formUrl, stepId, scope);
      if (path) {
        openDemoLink(path);
      }
    },
    [definition, formUrl],
  );

  // A Change button reports the step and scope it belongs to; the library turns that into the link,
  // including the choice between an authored field id and a scope pointer.
  const handleReviewChange = useCallback(
    (stepId: number | undefined, scope: string) => openExternalPath(stepId, scope),
    [openExternalPath],
  );

  const runAction = useCallback(async (action: () => Promise<unknown>) => {
    setError(undefined);
    setBusy(true);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, []);

  const handleCreateDefinition = useCallback(
    () =>
      runAction(async () => {
        await dispatch(
          createDefinitionFromTemplate({
            name: EXTERNAL_NAVIGATION_DEFINITION_NAME,
            description: EXTERNAL_NAVIGATION_DEFINITION_DESCRIPTION,
            dataSchema: externalNavigationDataSchema,
            uiSchema: externalNavigationUiSchema,
            applicantRoles: EXTERNAL_NAVIGATION_APPLICANT_ROLES,
          }),
        ).unwrap();
        await dispatch(loadDefinition(EXTERNAL_NAVIGATION_DEFINITION_ID)).unwrap();
      }),
    [dispatch, runAction],
  );

  const handleCreateDraft = useCallback(
    () =>
      runAction(async () => {
        await dispatch(createForm(EXTERNAL_NAVIGATION_DEFINITION_ID)).unwrap();
        await dispatch(findUserForms({ definitionId: EXTERNAL_NAVIGATION_DEFINITION_ID })).unwrap();
      }),
    [dispatch, runAction],
  );

  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width="full"
        testId="JsonformsExternalNavigationContainer"
        heading="External form navigation"
      >
        <GoabText size="body-m">
          This page is a host application. It links into a multi-page form running in form-app, addressing a page by id
          or a field by scope. The form is the same template the tenant admin gets from Add form, switched to the pages
          variant.
        </GoabText>

        {error && (
          <GoabCallout type="emergency" heading="That did not work" mt="m" mb="m">
            {error}
          </GoabCallout>
        )}

        {(busy || definition === undefined) && <LoadingIndicator isLoading={true} />}

        {definition === null && !busy && (
          <>
            <GoabText size="body-m" mt="m">
              The demo form <b>{EXTERNAL_NAVIGATION_DEFINITION_ID}</b> does not exist in this tenant yet. Creating it
              writes a form definition through form-service, which needs the{' '}
              <code>urn:ads:platform:form-service:form-admin</code> role.
            </GoabText>
            <GoabButtonGroup alignment="start" mt="m">
              <GoabButton type="primary" testId="create-demo-definition" onClick={handleCreateDefinition}>
                Create the demo form
              </GoabButton>
            </GoabButtonGroup>
          </>
        )}

        {definition && !draft && !busy && (
          <>
            <GoabText size="body-m" mt="m">
              {formsInitialized
                ? 'The demo form exists, but you have no draft of it. A link has to point at a form, so create one.'
                : 'Looking for your draft…'}
            </GoabText>
            {formsInitialized && (
              <GoabButtonGroup alignment="start" mt="m">
                <GoabButton type="primary" testId="create-demo-draft" onClick={handleCreateDraft}>
                  Create a draft
                </GoabButton>
              </GoabButtonGroup>
            )}
          </>
        )}

        {definition && draft && !busy && (
          <>
            {!formAppHost && (
              <GoabCallout type="important" heading="No form app address" mt="m" mb="m">
                The service directory has no <code>{FORM_APP_ID}</code> entry, so the links cannot be built.
              </GoabCallout>
            )}

            <h3>Pages</h3>
            <GoabText size="body-m">
              Each button opens <code>?page=</code> with the id the definition yields. Pages carrying an authored{' '}
              <code>options.id</code> are <b>named</b> — those links survive the pages being reordered or relabelled.
              Pages without one fall back to a positional <code>page-N</code> id, which points at whatever sits in that
              slot today. Personal Information and Address Information are named; Upload Information deliberately is
              not, so both behaviours are visible side by side.
            </GoabText>
            <GoabButtonGroup alignment="start" mt="m" mb="l">
              {navigationTargets.map(({ pageId, label, authored, index }) => (
                <GoabButton
                  key={pageId}
                  type="secondary"
                  testId={`form-page-link-${pageId}`}
                  leadingIcon="open"
                  disabled={!formUrl}
                  onClick={() => openExternalPath(index)}
                >
                  {`${label ?? pageId} — ${authored ? `${pageId} (named)` : `${pageId} (positional)`}`}
                </GoabButton>
              ))}
            </GoabButtonGroup>

            <h3>Fields</h3>
            <GoabText size="body-m">
              These carry no page id at all — the target locates its own page. Fields with an authored{' '}
              <code>options.id</code> link by <b>id</b> (<code>?fieldId=</code>), which survives the property being
              renamed in the data schema; the rest link by scope pointer (<code>?field=</code>). Either way the form
              opens the page owning the field, then scrolls to it and focuses it.
            </GoabText>
            {navigationTargets
              .filter(({ fields }) => fields.length > 0)
              .map(({ pageId, label, fields }) => (
                <div key={`fields-${pageId}`}>
                  <p>
                    <b>{label ?? pageId}</b>
                  </p>
                  <GoabButtonGroup alignment="start" mb="m">
                    {fields.map(({ scope, id }) => (
                      <GoabButton
                        key={scope}
                        type="secondary"
                        testId={id ? `form-field-link-${id}` : `form-field-link-${scope}`}
                        leadingIcon="open"
                        disabled={!formUrl}
                        onClick={() => openExternalPath(undefined, scope)}
                      >
                        {id ? `${fieldLabel(scope)} — ${id} (named)` : fieldLabel(scope)}
                      </GoabButton>
                    ))}
                  </GoabButtonGroup>
                </div>
              ))}

            <h3>Review summary</h3>
            <GoabText size="body-m">
              The same idea as the buttons above, in the shape a real host would build it: a read-only summary of the
              saved answers, with a Change button beside each. The button reports the scope it belongs to through{' '}
              <code>onReviewChange</code>, and this page turns that into the same deep link — by authored id where the
              control has one. A freshly created draft is empty, so fill a field or two in the form first if there is
              nothing to see here.
            </GoabText>
            <ContextProvider showChangeButtons={true}>
              <ReviewRenderProvider onReviewChange={handleReviewChange}>
                <JsonForms
                  readonly={true}
                  ajv={ajv}
                  schema={definition.dataSchema}
                  uischema={definition.uiSchema}
                  data={formData ?? {}}
                  validationMode="NoValidation"
                  renderers={GoAReviewRenderers}
                  cells={GoACells}
                />
              </ReviewRenderProvider>
            </ContextProvider>
          </>
        )}
      </GoabContainer>
    </ServiceContainer>
  );
};
