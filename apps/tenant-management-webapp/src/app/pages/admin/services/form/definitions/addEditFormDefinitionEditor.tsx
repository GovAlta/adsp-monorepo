import React, { FunctionComponent, useState, useEffect, useRef } from 'react';

import Editor from '@monaco-editor/react';
import { FormDefinition } from '@store/form/model';

import { toKebabName } from '@lib/kebabName';
import { useValidators } from '@lib/validation/useValidators';
import { isNotEmptyCheck, wordMaxLengthCheck, badCharsCheck, duplicateNameCheck } from '@lib/validation/checkInput';
import { FETCH_KEYCLOAK_SERVICE_ROLES } from '@store/access/actions';
import { ActionState } from '@store/session/models';
import { ClientRoleTable } from '@components/RoleTable';
import {
  SpinnerModalPadding,
  FormFormItem,
  HelpText,
  DescriptionItem,
  ErrorMsg,
  TextLoadingIndicator,
  FlexRow,
  FlexLeft,
  FlexRight,
  EditorPadding,
  FinalButtonPadding,
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

import { useHistory, useParams } from 'react-router-dom';

import { GoATextArea, GoAInput, GoAButtonGroup, GoAFormItem, GoAButton, GoAIcon } from '@abgov/react-components-new';

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height,
  };
}

export default function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowDimensions;
}

export const AddEditFormDefinitionEditor: FunctionComponent = () => {
  const [definition, setDefinition] = useState<FormDefinition>(defaultFormDefinition);
  const [spinner, setSpinner] = useState<boolean>(false);
  const { id } = useParams<{ id: string }>();

  const { height } = useWindowDimensions();

  const isEdit = !!id;

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchKeycloakServiceRoles());
    dispatch(getFormDefinitions());
  }, []);

  const types = [
    { type: 'applicantRoles', name: 'Applicant Roles' },
    { type: 'clerkRoles', name: 'Clerk Roles' },
    { type: 'assessorRoles', name: 'Assessor Roles' },
  ];

  const formDefinitions = useSelector((state: RootState) => state?.form?.definitions || []);

  const selectServiceKeycloakRoles = createSelector(
    (state: RootState) => state.serviceRoles,
    (serviceRoles) => {
      return serviceRoles?.keycloak || {};
    }
  );

  useEffect(() => {
    dispatch(FetchRealmRoles());
  }, []);

  useEffect(() => {
    if (id && formDefinitions[id]) {
      setDefinition(formDefinitions[id]);
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
    const assessorRoles = types[2];

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
  const descErrMessage = 'Description can not be over 180 characters';

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
    <div style={{ width: '100%' }}>
      <h1>{isEdit ? 'Edit' : 'Add'} definition</h1>
      {spinner ? (
        <SpinnerModalPadding>
          <GoAPageLoader visible={true} type="infinite" message={'Loading...'} pagelock={false} />
        </SpinnerModalPadding>
      ) : (
        <FlexRow>
          <FlexLeft>
            <FormFormItem>
              <GoAFormItem error={errors?.['name']} label="Name">
                <GoAInput
                  type="text"
                  name="form-definition-name"
                  value={definition?.name}
                  testId="form-definition-name"
                  aria-label="form-definition-name"
                  width="100%"
                  onChange={(name, value) => {
                    const validations = {
                      name: value,
                      duplicate: definition.name,
                    };
                    validators.remove('name');

                    validators.checkAll(validations);

                    setDefinition(
                      isEdit ? { ...definition, name: value } : { ...definition, name: value, id: toKebabName(value) }
                    );
                  }}
                />
              </GoAFormItem>
            </FormFormItem>
            <GoAFormItem label="Definition ID">
              <FormFormItem>
                <GoAInput
                  name="form-definition-id"
                  value={definition?.id}
                  testId="form-definition-id"
                  disabled={true}
                  width="100%"
                  // eslint-disable-next-line
                  onChange={() => {}}
                />
              </FormFormItem>
            </GoAFormItem>

            <GoAFormItem label="Description">
              <DescriptionItem>
                <GoATextArea
                  name="form-definition-description"
                  value={definition?.description}
                  width="100%"
                  testId="form-definition-description"
                  aria-label="form-definition-description"
                  onChange={(name, value) => {
                    validators.remove('description');
                    validators['description'].check(value);
                    setDefinition({ ...definition, description: value });
                  }}
                />

                <HelpText>
                  {definition.description.length <= 180 ? (
                    <div> {descErrMessage} </div>
                  ) : (
                    <ErrorMsg>
                      <GoAIcon type="warning" size="small" theme="filled" />
                      {`  ${errors?.['description']}`}
                    </ErrorMsg>
                  )}
                  <div>{`${definition.description.length}/180`}</div>
                </HelpText>
              </DescriptionItem>
            </GoAFormItem>
            <GoAFormItem label="Data schema" error={errors?.['payloadSchema']}>
              <EditorPadding>
                <Editor
                  data-testid="form-schema"
                  height={height - 750}
                  value={definition.dataSchema}
                  onChange={(value) => {
                    validators.remove('payloadSchema');
                    setDefinition({ ...definition, dataSchema: value });
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
          </FlexLeft>
          <FlexRight>
            {elements.map((e, key) => {
              return <ClientRole roleNames={e.roleNames} key={key} clientId={e.clientId} />;
            })}
            {fetchKeycloakRolesState === ActionState.inProcess && (
              <TextLoadingIndicator>Loading roles from access service</TextLoadingIndicator>
            )}
          </FlexRight>
        </FlexRow>
      )}
      <FinalButtonPadding>
        <GoAButtonGroup alignment="end">
          <GoAButton
            testId="form-cancel"
            type="secondary"
            onClick={() => {
              validators.clear();
              close();
            }}
          >
            Cancel
          </GoAButton>
          <GoAButton
            type="primary"
            testId="form-save"
            disabled={!definition.name || validators.haveErrors()}
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
        </GoAButtonGroup>
      </FinalButtonPadding>
    </div>
  );
};
