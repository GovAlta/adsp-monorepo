import React, { useState, useEffect } from 'react';

import Editor from '@monaco-editor/react';
import { materialRenderers, materialCells } from '@jsonforms/material-renderers';
import { JsonForms } from '@jsonforms/react';
import { FormDefinition } from '@store/form/model';

import { useValidators } from '@lib/validation/useValidators';
import { isNotEmptyCheck, wordMaxLengthCheck, badCharsCheck, duplicateNameCheck } from '@lib/validation/checkInput';
import { FETCH_KEYCLOAK_SERVICE_ROLES } from '@store/access/actions';
import { ActionState } from '@store/session/models';
import { ClientRoleTable } from '@components/RoleTable';
import { SaveFormModal } from '@components/saveModal';

import { useDebounce } from '@lib/useDebounce';
const Ajv = require('ajv');

const ajv = new Ajv();

import {
  SpinnerModalPadding,
  TextLoadingIndicator,
  FlexRow,
  NameDescriptionDataSchema,
  FormPreviewContainer,
  EditorPadding,
  FinalButtonPadding,
  FormEditorTitle,
  FormEditor,
  ScrollPane,
  MonacoDivBody,
} from '../styled-components';
import { GoAPageLoader } from '@abgov/react-components';

import { ConfigServiceRole } from '@store/access/models';
import { getFormDefinitions } from '@store/form/action';
import { updateFormDefinition } from '@store/form/action';

import { createSelector } from 'reselect';

import { RootState } from '@store/index';
import { useSelector, useDispatch } from 'react-redux';
import { fetchKeycloakServiceRoles } from '@store/access/actions';
import { defaultFormDefinition } from '@store/form/model';
import { FormConfigDefinition } from './formConfigDefinition';
import { useHistory, useParams } from 'react-router-dom';
import { GoAButtonGroup, GoAButton, GoAFormItem } from '@abgov/react-components-new';
import useWindowDimensions from '@lib/useWindowDimensions';
import { FetchRealmRoles } from '@store/tenant/actions';
import { Tab, Tabs } from '@components/Tabs';

const isFormUpdated = (prev: FormDefinition, next: FormDefinition): boolean => {
  const tempPrev = JSON.parse(JSON.stringify(prev));
  const tempNext = JSON.parse(JSON.stringify(next));

  return (
    JSON.stringify(tempPrev?.applicantRoles) != JSON.stringify(tempNext?.applicantRoles) ||
    JSON.stringify(tempPrev?.assessorRoles) != JSON.stringify(tempNext?.assessorRoles) ||
    JSON.stringify(tempPrev?.clerkRoles) != JSON.stringify(tempNext?.clerkRoles) ||
    JSON.stringify(tempPrev?.dataSchema) != JSON.stringify(tempNext?.dataSchema) ||
    JSON.stringify(tempPrev?.uiSchema) != JSON.stringify(tempNext?.uiSchema)
  );
};

const dataSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 1,
    },
    done: {
      type: 'boolean',
    },
    due_date: {
      type: 'string',
      format: 'date',
    },
    recurrence: {
      type: 'string',
      enum: ['Never', 'Daily', 'Weekly', 'Monthly'],
    },
  },
  required: ['name', 'due_date'],
};

export const formEditorJsonConfig = {
  'data-testid': 'templateForm-test-input',
  options: {
    selectOnLineNumbers: true,
    renderIndentGuides: true,
    colorDecorators: true,
  },
};

const uiSchema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      label: false,
      scope: '#/properties/done',
    },
    {
      type: 'Control',
      scope: '#/properties/name',
    },
    {
      type: 'HorizontalLayout',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/due_date',
        },
        {
          type: 'Control',
          scope: '#/properties/recurrence',
        },
      ],
    },
  ],
};

const invalidJsonMsg = 'Invalid JSON syntax';

export function AddEditFormDefinitionEditor(): JSX.Element {
  const [definition, setDefinition] = useState<FormDefinition>(defaultFormDefinition);
  const [initialDefinition, setInitialDefinition] = useState<FormDefinition>(defaultFormDefinition);

  const [tempUiSchema, setTempUiSchema] = useState<string>(JSON.stringify(uiSchema, null, 2));
  const [tempDataSchema, setTempDataSchema] = useState<string>(JSON.stringify(dataSchema, null, 2));
  const [UiSchemaBounced, setTempUiSchemaBounced] = useState<string>(JSON.stringify(uiSchema, null, 2));
  const [dataSchemaBounced, setDataSchemaBounced] = useState<string>(JSON.stringify(dataSchema, null, 2));
  const [data, setData] = useState('');
  const [error, setError] = useState('');
  const [spinner, setSpinner] = useState<boolean>(false);
  const { id } = useParams<{ id: string }>();
  const [saveModal, setSaveModal] = useState({ visible: false, closeEditor: false });

  const debouncedRenderUISchema = useDebounce(tempUiSchema, 1000);
  const debouncedRenderDataSchema = useDebounce(tempDataSchema, 1000);

  const isEdit = !!id;

  const dispatch = useDispatch();
  const latestNotification = useSelector(
    (state: RootState) => state.notifications.notifications[state.notifications.notifications.length - 1]
  );

  const { height } = useWindowDimensions();
  const calcHeight = latestNotification && !latestNotification.disabled ? height - 50 : height;
  const EditorHeight = calcHeight - 600;
  const [editorErrors, setEditorErrors] = useState({ uiSchema: null, dataSchema: null });

  useEffect(() => {
    dispatch(FetchRealmRoles());

    dispatch(fetchKeycloakServiceRoles());
    dispatch(getFormDefinitions());
  }, []);

  const types = [
    { type: 'applicantRoles', name: 'Applicant roles' },
    { type: 'clerkRoles', name: 'Clerk roles' },
    { type: 'assessorRoles', name: 'Assessor roles' },
  ];

  const formDefinitions = useSelector((state: RootState) => state?.form?.definitions || []);

  const selectServiceKeycloakRoles = createSelector(
    (state: RootState) => state.serviceRoles,
    (serviceRoles) => {
      return serviceRoles?.keycloak || {};
    }
  );

  useEffect(() => {
    if (saveModal.closeEditor) {
      close();
    }
  }, [saveModal]);

  useEffect(() => {
    if (id && formDefinitions[id]) {
      const tempFormDefinition = formDefinitions[id] as FormDefinition;
      if (Object.keys(tempFormDefinition.dataSchema || {}).length > 0) {
        setTempUiSchema(JSON.stringify(tempFormDefinition.uiSchema, null, 2));
        setTempUiSchemaBounced(JSON.stringify(tempFormDefinition.uiSchema, null, 2));
      }
      if (Object.keys(tempFormDefinition.uiSchema || {}).length > 0) {
        setTempDataSchema(JSON.stringify(tempFormDefinition.dataSchema, null, 2));
        setDataSchemaBounced(JSON.stringify(tempFormDefinition.dataSchema, null, 2));
      }
      setInitialDefinition(formDefinitions[id]);
      setDefinition(formDefinitions[id]);
    }
  }, [formDefinitions]);

  useEffect(() => {
    try {
      JSON.parse(tempUiSchema);
      setTempUiSchemaBounced(tempUiSchema);
      setError('');
    } catch {
      setTempUiSchemaBounced('{}');
      setError(invalidJsonMsg);
    }
  }, [debouncedRenderUISchema]);

  useEffect(() => {
    try {
      JSON.parse(tempDataSchema);
      setDataSchemaBounced(tempDataSchema);
      setError('');
    } catch (e) {
      setDataSchemaBounced('{}');
      setError(invalidJsonMsg);
    }
  }, [debouncedRenderDataSchema]);

  const history = useHistory();

  const close = () => {
    history.push({
      pathname: '/admin/services/form',
      search: '?definitions=true',
    });
  };

  const { fetchKeycloakRolesState } = useSelector((state: RootState) => ({
    fetchKeycloakRolesState: state.session.indicator?.details[FETCH_KEYCLOAK_SERVICE_ROLES] || '',
  }));
  //eslint-disable-next-line
  useEffect(() => {}, [fetchKeycloakRolesState]);

  const ClientRole = ({ roleNames, clientId }) => {
    const applicantRoles = types[0];
    const clerkRoles = types[1];

    return (
      <>
        <ClientRoleTable
          roles={roleNames}
          clientId={clientId}
          anonymousRead={definition.anonymousApply}
          roleSelectFunc={(roles, type) => {
            if (type === applicantRoles.name) {
              setDefinition({
                ...definition,
                applicantRoles: roles,
              });
            } else if (type === clerkRoles.name) {
              setDefinition({
                ...definition,
                clerkRoles: roles,
              });
            } else {
              setDefinition({
                ...definition,
                assessorRoles: roles,
              });
            }
          }}
          nameColumnWidth={40}
          service="FileType"
          checkedRoles={[
            { title: types[0].name, selectedRoles: definition[types[0].type] },
            { title: types[1].name, selectedRoles: definition[types[1].type] },
            { title: types[2].name, selectedRoles: definition[types[2].type] },
          ]}
        />
      </>
    );
  };

  const roles = useSelector((state: RootState) => state.tenant.realmRoles) || [];

  const roleNames = roles.map((role) => {
    return role.name;
  });

  const keycloakClientRoles = useSelector(selectServiceKeycloakRoles);
  let elements = [{ roleNames: roleNames, clientId: '', currentElements: null }];

  const clientElements =
    Object.entries(keycloakClientRoles).length > 0 &&
    Object.entries(keycloakClientRoles)
      .filter(([clientId, config]) => {
        return (config as ConfigServiceRole).roles.length > 0;
      })
      .map(([clientId, config]) => {
        const roles = (config as ConfigServiceRole).roles;
        const roleNames = roles.map((role) => {
          return role.role;
        });
        return { roleNames: roleNames, clientId: clientId, currentElements: null };
      });
  elements = elements.concat(clientElements);

  const definitions = useSelector((state: RootState) => {
    return state?.form?.definitions;
  });
  const definitionIds = Object.keys(definitions);

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const [activeIndex] = useState<number>(0);

  useEffect(() => {
    if (spinner && Object.keys(definitions).length > 0) {
      if (validators['duplicate'].check(definition.id)) {
        setSpinner(false);
        return;
      }

      setSpinner(false);
    }
  }, [definitions]);

  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);

  const getStyles = latestNotification && !latestNotification.disabled ? '410px' : '310px';

  const { errors, validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('name')
  )
    .add('duplicate', 'name', duplicateNameCheck(definitionIds, 'definition'))
    .add('description', 'description', wordMaxLengthCheck(180, 'Description'))
    .build();

  return (
    <FormEditor>
      {spinner ? (
        <SpinnerModalPadding>
          <GoAPageLoader visible={true} type="infinite" message={'Loading...'} pagelock={false} />
        </SpinnerModalPadding>
      ) : (
        <FlexRow>
          <NameDescriptionDataSchema>
            <FormEditorTitle>Form / Definition Editor</FormEditorTitle>
            <hr className="hr-resize" />
            {definition && <FormConfigDefinition definition={definition} />}

            <Tabs activeIndex={activeIndex} data-testid="form-editor-tabs">
              <Tab label="Data schema" data-testid="form-editor-tab">
                <GoAFormItem error={errors?.body ?? editorErrors?.dataSchema ?? null} label="">
                  <EditorPadding>
                    <Editor
                      data-testid="form-schema"
                      height={calcHeight - 550}
                      value={tempDataSchema}
                      onChange={(value) => {
                        validators.remove('payloadSchema');
                        setTempDataSchema(value);
                      }}
                      onValidate={(makers) => {
                        if (makers.length === 0) {
                          setEditorErrors({
                            ...editorErrors,
                            dataSchema: null,
                          });
                          return;
                        }
                        setEditorErrors({
                          ...editorErrors,
                          dataSchema: `Invalid JSON: col ${makers[0]?.endColumn}, line: ${makers[0]?.endLineNumber}, ${makers[0]?.message}`,
                        });
                      }}
                      language="json"
                      options={{
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
                        tabSize: 2,
                        minimap: { enabled: false },
                      }}
                    />
                  </EditorPadding>
                </GoAFormItem>
              </Tab>
              <Tab label="UI schema" data-testid="form-editor-tab">
                <MonacoDivBody data-testid="templated-editor-body" style={{ height: `calc(72vh - ${getStyles})` }}>
                  <Editor
                    value={tempUiSchema}
                    {...formEditorJsonConfig}
                    onValidate={(makers) => {
                      if (makers.length === 0) {
                        setEditorErrors({
                          ...editorErrors,
                          uiSchema: null,
                        });
                        return;
                      }
                      setEditorErrors({
                        ...editorErrors,
                        uiSchema: `Invalid JSON: col ${makers[0]?.endColumn}, line: ${makers[0]?.endLineNumber}, ${makers[0]?.message}`,
                      });
                    }}
                    onChange={(value) => {
                      setTempUiSchema(value);
                    }}
                    language="json"
                    options={{
                      automaticLayout: true,
                      scrollBeyondLastLine: false,
                      tabSize: 2,
                      minimap: { enabled: false },
                    }}
                  />
                </MonacoDivBody>
              </Tab>
              <Tab label="Roles" data-testid="form-roles-tab">
                <ScrollPane>
                  {elements.map((e, key) => {
                    return <ClientRole roleNames={e.roleNames} key={key} clientId={e.clientId} />;
                  })}
                  {fetchKeycloakRolesState === ActionState.inProcess && (
                    <TextLoadingIndicator>Loading roles from access service</TextLoadingIndicator>
                  )}
                </ScrollPane>
              </Tab>
            </Tabs>

            <hr className="hr-resize-bottom" />
            <FinalButtonPadding>
              <GoAButtonGroup alignment="start">
                <GoAButton
                  type="primary"
                  testId="form-save"
                  disabled={
                    !isFormUpdated(initialDefinition, {
                      ...definition,
                      uiSchema: JSON.parse(UiSchemaBounced),
                      dataSchema: JSON.parse(dataSchemaBounced),
                    }) ||
                    !definition.name ||
                    validators.haveErrors() ||
                    editorErrors.dataSchema !== null ||
                    editorErrors.uiSchema !== null
                  }
                  onClick={() => {
                    if (indicator.show === true) {
                      setSpinner(true);
                    } else {
                      if (!isEdit) {
                        const validations = {
                          duplicate: definition.name,
                        };
                        if (!validators.checkAll(validations)) {
                          return;
                        }
                      }
                      setSpinner(true);
                      dispatch(
                        updateFormDefinition({
                          ...definition,
                          uiSchema: JSON.parse(UiSchemaBounced),
                          dataSchema: JSON.parse(dataSchemaBounced),
                        })
                      );

                      close();
                    }
                  }}
                >
                  Save
                </GoAButton>
                <GoAButton
                  testId="form-cancel"
                  type="secondary"
                  onClick={() => {
                    if (
                      isFormUpdated(initialDefinition, {
                        ...definition,
                        uiSchema: JSON.parse(UiSchemaBounced),
                        dataSchema: JSON.parse(dataSchemaBounced),
                      })
                    ) {
                      setSaveModal({ visible: true, closeEditor: false });
                    } else {
                      validators.clear();
                      close();
                    }
                  }}
                >
                  Back
                </GoAButton>
              </GoAButtonGroup>
            </FinalButtonPadding>
          </NameDescriptionDataSchema>

          <FormPreviewContainer>
            <FormEditorTitle>Preview</FormEditorTitle>
            <hr className="hr-resize" />
            <div style={{ paddingTop: '2rem' }}>
              <GoAFormItem error={error} label="">
                <JsonForms
                  schema={JSON.parse(dataSchemaBounced)}
                  uischema={JSON.parse(UiSchemaBounced)}
                  data={data}
                  validationMode={'NoValidation'}
                  renderers={materialRenderers}
                  cells={materialCells}
                  onChange={({ data }) => setData(data)}
                />
              </GoAFormItem>
            </div>
          </FormPreviewContainer>
        </FlexRow>
      )}
      <SaveFormModal
        open={saveModal.visible}
        onDontSave={() => {
          setSaveModal({ visible: false, closeEditor: true });
        }}
        onSave={() => {
          if (!isEdit) {
            const validations = {
              duplicate: definition.name,
            };
            if (!validators.checkAll(validations)) {
              return;
            }
          }
          setSpinner(true);
          dispatch(updateFormDefinition(definition));
          setSaveModal({ visible: false, closeEditor: true });
        }}
        saveDisable={!isFormUpdated(initialDefinition, definition)}
        onCancel={() => {
          setSaveModal({ visible: false, closeEditor: false });
        }}
      />
    </FormEditor>
  );
}
