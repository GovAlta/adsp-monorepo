import React, { useState, useEffect } from 'react';

import Editor from '@monaco-editor/react';
import { FormDefinition } from '@store/form/model';

import { useValidators } from '@lib/validation/useValidators';
import { isNotEmptyCheck, wordMaxLengthCheck, badCharsCheck, duplicateNameCheck } from '@lib/validation/checkInput';
import { FETCH_KEYCLOAK_SERVICE_ROLES } from '@store/access/actions';
import { ActionState } from '@store/session/models';
import { ClientRoleTable } from '@components/RoleTable';
import { SaveFormModal } from '@components/saveModal';
import {
  SpinnerModalPadding,
  TextLoadingIndicator,
  FlexRow,
  NameDescriptionDataSchema,
  FormPermissions,
  EditorPadding,
  FinalButtonPadding,
  FormEditorTitle,
  FormEditor,
  ScrollPane,
} from '../styled-components';
import { GoAPageLoader } from '@abgov/react-components';
import { FetchRealmRoles } from '@store/tenant/actions';
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

import { GoAButtonGroup, GoAFormItem, GoAButton } from '@abgov/react-components-new';
import useWindowDimensions from '@lib/useWindowDimensions';

const isFormUpdated = (prev: FormDefinition, next: FormDefinition): boolean => {
  return (
    prev?.applicantRoles !== next?.applicantRoles ||
    prev?.assessorRoles !== next?.assessorRoles ||
    prev?.clerkRoles !== next?.clerkRoles ||
    prev?.dataSchema !== next?.dataSchema
  );
};

export function AddEditFormDefinitionEditor(): JSX.Element {
  const [definition, setDefinition] = useState<FormDefinition>(defaultFormDefinition);
  const [initialDefinition, setInitialDefinition] = useState<FormDefinition>(defaultFormDefinition);
  const [spinner, setSpinner] = useState<boolean>(false);
  const { id } = useParams<{ id: string }>();
  const [saveModal, setSaveModal] = useState({ visible: false, closeEditor: false });

  const isEdit = !!id;

  const dispatch = useDispatch();

  const { height } = useWindowDimensions();

  useEffect(() => {
    dispatch(fetchKeycloakServiceRoles());
    dispatch(getFormDefinitions());
    dispatch(FetchRealmRoles());
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
      setDefinition(formDefinitions[id]);
      setInitialDefinition(formDefinitions[id]);
    }
  }, [formDefinitions]);

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

            <GoAFormItem label="Data schema" error={errors?.['payloadSchema']}>
              <EditorPadding>
                <Editor
                  data-testid="form-schema"
                  height={height - 550}
                  value={JSON.stringify(definition.dataSchema)}
                  onChange={(value) => {
                    validators.remove('payloadSchema');
                    setDefinition({ ...definition, dataSchema: JSON.parse(value) });
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
            <hr className="hr-resize-bottom" />
            <FinalButtonPadding>
              <GoAButtonGroup alignment="start">
                <GoAButton
                  type="primary"
                  testId="form-save"
                  disabled={
                    !isFormUpdated(initialDefinition, definition) || !definition.name || validators.haveErrors()
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
                      dispatch(updateFormDefinition(definition));

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
                    if (isFormUpdated(initialDefinition, definition)) {
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
          <FormPermissions>
            <FormEditorTitle>Form permissions</FormEditorTitle>
            <hr className="hr-resize" />
            <ScrollPane>
              {elements.map((e, key) => {
                return <ClientRole roleNames={e.roleNames} key={key} clientId={e.clientId} />;
              })}
              {fetchKeycloakRolesState === ActionState.inProcess && (
                <TextLoadingIndicator>Loading roles from access service</TextLoadingIndicator>
              )}
            </ScrollPane>
          </FormPermissions>
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
