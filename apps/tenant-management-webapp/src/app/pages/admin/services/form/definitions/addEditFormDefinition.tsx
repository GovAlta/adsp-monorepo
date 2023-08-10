import React, { FunctionComponent, useState, useEffect } from 'react';

import Editor from '@monaco-editor/react';
import { FormDefinition } from '@store/form/model';
import { Role } from '@store/tenant/models';
import { toKebabName } from '@lib/kebabName';
import { useValidators } from '@lib/validation/useValidators';
import { isNotEmptyCheck, wordMaxLengthCheck, badCharsCheck, duplicateNameCheck } from '@lib/validation/checkInput';
import { FETCH_KEYCLOAK_SERVICE_ROLES } from '@store/access/actions';
import { ActionState } from '@store/session/models';
import {
  SpinnerModalPadding,
  FormFormItem,
  HelpText,
  DescriptionItem,
  ErrorMsg,
  TextLoadingIndicator,
} from '../styled-components';
import { GoAPageLoader } from '@abgov/react-components';
import { FetchRealmRoles } from '@store/tenant/actions';
import { ConfigServiceRole } from '@store/access/models';

import { createSelector } from 'reselect';
import { GoACheckbox } from '@abgov/react-components-new';
import { Tab, Tabs } from '@components/Tabs';

import { RootState } from '@store/index';
import { useSelector, useDispatch } from 'react-redux';

import {
  GoATextArea,
  GoAInput,
  GoAModal,
  GoAButtonGroup,
  GoAFormItem,
  GoAButton,
  GoAIcon,
} from '@abgov/react-components-new';
import e from 'express';
interface AddEditFormDefinitionProps {
  open: boolean;
  isEdit: boolean;
  initialValue?: FormDefinition;
  onClose: () => void;
  onSave: (definition: FormDefinition) => void;
}

export const AddEditFormDefinition: FunctionComponent<AddEditFormDefinitionProps> = ({
  initialValue,
  isEdit,
  onClose,
  open,
  onSave,
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [definition, setDefinition] = useState<FormDefinition>(initialValue);
  const [spinner, setSpinner] = useState<boolean>(false);

  const selectServiceKeycloakRoles = createSelector(
    (state: RootState) => state.serviceRoles,
    (serviceRoles) => {
      return serviceRoles?.keycloak || {};
    }
  );
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(FetchRealmRoles());
  }, []);

  useEffect(() => {
    setDefinition(initialValue);
  }, [open]);

  const { fetchKeycloakRolesState } = useSelector((state: RootState) => ({
    fetchKeycloakRolesState: state.session.indicator?.details[FETCH_KEYCLOAK_SERVICE_ROLES] || '',
  }));
  //eslint-disable-next-line
  useEffect(() => {}, [fetchKeycloakRolesState]);

  const ClientRole = ({ roleNames, clientId, type }) => {
    return (
      <>
        <thead>
          <tr>
            <p>
              <b>{clientId}</b>
            </p>
          </tr>
        </thead>

        <tbody>
          {roleNames?.map((role): JSX.Element => {
            const compositeRole = clientId ? `${clientId}:${role}` : role;
            return (
              <tr key={` row-${role}`}>
                <td className="role">
                  <GoACheckbox
                    name={`${type}-role-checkbox-${compositeRole}`}
                    key={`${type}-role-checkbox-${compositeRole}`}
                    checked={definition[type]?.includes(`${type}-role-checkbox-${compositeRole}`)}
                    data-testid={`${type}-role-checkbox-${compositeRole}`}
                    onChange={(name) => {
                      if (definition[type]?.includes(name)) {
                        definition[type] = definition[type]?.filter((r) => r !== name);
                      } else {
                        definition[type] = (definition[type] || []).concat(name);
                      }
                      setDefinition(definition);
                    }}
                  >
                    <div className="role-name">{role}</div>
                  </GoACheckbox>
                </td>
              </tr>
            );
          })}
        </tbody>
      </>
    );
  };

  const roles = useSelector((state: RootState) => state.tenant.realmRoles);

  const keycloakClientRoles = useSelector(selectServiceKeycloakRoles);
  let elements = [{ roleNames: null, clientId: '', currentElements: null }];

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

  const types = [
    { type: 'applicantRoles', name: 'Applicant Roles' },
    { type: 'clerkRoles', name: 'Clerk Roles' },
    { type: 'assessorRoles', name: 'Assessor Roles' },
  ];

  useEffect(() => {
    if (spinner && Object.keys(definitions).length > 0) {
      if (validators['duplicate'].check(definition.id)) {
        setSpinner(false);
        return;
      }
      onSave(definition);
      onClose();
      setSpinner(false);
    }
  }, [definitions]);

  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);

  useEffect(() => {
    setDefinition(initialValue);
  }, [open]);

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
    <GoAModal
      testId="definition-form"
      open={open}
      heading={`${isEdit ? 'Edit' : 'Add'} definition`}
      width="640px"
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton
            testId="form-cancel"
            type="secondary"
            onClick={() => {
              validators.clear();
              onClose();
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
                onSave(definition);
                onClose();
              }
            }}
          >
            Save
          </GoAButton>
        </GoAButtonGroup>
      }
    >
      {spinner ? (
        <SpinnerModalPadding>
          <GoAPageLoader visible={true} type="infinite" message={'Loading...'} pagelock={false} />
        </SpinnerModalPadding>
      ) : (
        <>
          <FormFormItem>
            <GoAFormItem error={errors?.['name']} label="Name">
              <GoAInput
                type="text"
                name="form-definition-name"
                value={definition.name}
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
                value={definition.id}
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
                value={definition.description}
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
            <label></label>
            <Editor
              data-testid="form-schema"
              height={120}
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
          </GoAFormItem>
          <Tabs activeIndex={activeIndex}>
            {types.map((type) => (
              <Tab label={type.name}>
                {roles &&
                  roles.map((role, key) => (
                    <GoACheckbox
                      name={role.name}
                      key={`${type.type}-checkbox-${key}`}
                      checked={definition[type.type]?.includes(role.name)}
                      data-testid={`${type.type}-checkbox-${key}`}
                      onChange={(name, {}, value) => {
                        if (definition[type.type]?.includes(name)) {
                          definition[type.type] = definition[type.type]?.filter((r) => r !== name);
                        } else {
                          definition[type.type] = (definition[type.type] || []).concat(name);
                        }
                        setDefinition(definition);
                      }}
                    >
                      {role.name}
                    </GoACheckbox>
                  ))}
                {fetchKeycloakRolesState === ActionState.inProcess && (
                  <TextLoadingIndicator>Loading roles from access service</TextLoadingIndicator>
                )}
                {elements.map((e, key) => {
                  return <ClientRole roleNames={e.roleNames} type={[type.type]} key={key} clientId={e.clientId} />;
                })}
              </Tab>
            ))}
          </Tabs>
        </>
      )}
    </GoAModal>
  );
};
