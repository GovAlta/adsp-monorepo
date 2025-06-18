import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DropDownZIndex,
  EditorPadding,
  FileTypeEditor,
  FileTypeEditorTitle,
  FileTypeEditorWarningCalloutWrapper,
  FileTypePermissions,
  FileTypesEditorTitle,
  FinalButtonPadding,
  FlexRow,
  MakePublicPadding,
  NameDescriptionDataSchema,
  RetentionPeriodText,
  RetentionPolicyLabel,
  RetentionPolicyWrapper,
  ScrollPane,
  TextLoadingIndicator,
} from '../styled-components';

import { useDispatch, useSelector } from 'react-redux';
import {
  GoAButton,
  GoACallout,
  GoADropdown,
  GoADropdownItem,
  GoAIcon,
  GoATooltip,
  GoAButtonGroup,
  GoACheckbox,
  GoAFormItem,
  GoAInput,
} from '@abgov/react-components';
import { FileTypeConfigDefinition } from './fileTypeConfigDefinition';
import { RootState } from '@store/index';
import { FileTypeDefault, FileTypeDefaultOnEdit, FileTypeItem } from '@store/file/models';
import { SecurityClassification } from '@store/common/models';
import { useValidators } from '@lib/validation/useValidators';
import { badCharsCheck, duplicateNameCheck, isNotEmptyCheck, wordMaxLengthCheck } from '@lib/validation/checkInput';
import { ConfigServiceRole } from '@store/access/models';
import { ClientRoleTable } from '@components/RoleTable';
import { SaveFormModal } from '@components/saveModal';
import { ActionState } from '@store/session/models';
import { FETCH_KEYCLOAK_SERVICE_ROLES, fetchKeycloakServiceRoles } from '@store/access/actions';
import { UpdateFileTypeService } from '@store/file/actions';
import { createSelector } from 'reselect';
import { selectFileTyeNames } from './fileTypeNew';
import { PageLoader } from '@core-services/app-common';
import { areObjectsEqual } from '@lib/objectUtil';
import { CustomLoader } from '@components/CustomLoader';
import { FetchRealmRoles } from '@store/tenant/actions';
import styled from 'styled-components';

export const EditFileTypeDefinitionEditor = (): JSX.Element => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const scrollPaneRef = useRef<HTMLDivElement>(null);
  const fileTypeNames = useSelector(selectFileTyeNames);
  const [spinner, setSpinner] = useState<boolean>(false);
  const [customIndicator, setCustomIndicator] = useState<boolean>(false);
  const [isSecurityClassificationCalloutOpen, setIsSecurityClassificationCalloutIsOpen] = useState<boolean>(false);
  const [saveModal, setSaveModal] = useState({ visible: false, closeEditor: false });
  const [initialFileType, setInitialFileType] = useState<FileTypeItem>(FileTypeDefault);
  const [fileType, setFileType] = useState<FileTypeItem>(FileTypeDefaultOnEdit);
  const { fetchKeycloakRolesState } = useSelector((state: RootState) => ({
    fetchKeycloakRolesState: state.session.indicator?.details[FETCH_KEYCLOAK_SERVICE_ROLES] || '',
  }));

  const selectServiceKeyCloakRoles = createSelector(
    (state: RootState) => state.serviceRoles,
    (serviceRoles) => {
      return serviceRoles?.keycloak || {};
    }
  );

  const keyCloakClientRoles = useSelector(selectServiceKeyCloakRoles);

  const close = () => {
    navigate('/admin/services/file?fileTypes=true');
  };

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const fileTypes: FileTypeItem[] = useSelector((state: RootState) => state.fileService.fileTypes);

  const roles = useSelector((state: RootState) => state.tenant.realmRoles);
  const roleNames = roles?.map((role) => {
    return role.name;
  });

  useEffect(() => {
    dispatch(fetchKeycloakServiceRoles());
    dispatch(FetchRealmRoles());

    const foundFileType = fileTypes?.find((f) => f.id === id);
    if (id && foundFileType) {
      const selectedFileType = foundFileType;
      setFileType(selectedFileType);
      setInitialFileType(selectedFileType);
      //For backwards compatibility
      if (!foundFileType?.securityClassification || foundFileType?.securityClassification === undefined) {
        fileType.securityClassification = '';
      }
      const isCalloutOpen =
        foundFileType.anonymousRead &&
        foundFileType.securityClassification !== SecurityClassification.Public &&
        foundFileType.securityClassification !== '';
      setIsSecurityClassificationCalloutIsOpen(isCalloutOpen);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const foundFileType = fileTypes?.find((f) => f.id === id);
    if (id && foundFileType) {
      const selectedFileType = foundFileType;
      setFileType(selectedFileType);
      setInitialFileType(selectedFileType);
      //For backwards compatibility
      if (!foundFileType?.securityClassification || foundFileType?.securityClassification === undefined) {
        fileType.securityClassification = '';
      }
      const isCalloutOpen =
        fileType.anonymousRead &&
        fileType.securityClassification !== SecurityClassification.Public &&
        fileType.securityClassification !== '';
      if (isCalloutOpen) {
        setIsSecurityClassificationCalloutIsOpen(!isSecurityClassificationCalloutOpen);
      }
      setCustomIndicator(false);
    }
  }, [fileTypes]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (saveModal.closeEditor) {
      close();
    }
  }, [saveModal]); // eslint-disable-line react-hooks/exhaustive-deps
  const { validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('name')
  )
    .add('duplicated', 'name', duplicateNameCheck(fileTypeNames, 'File type'))
    .build();

  let elements = [{ roleNames: roleNames, clientId: '', currentElements: null }];
  let clientElements = null;

  clientElements =
    Object.entries(keyCloakClientRoles).length > 0 &&
    Object.entries(keyCloakClientRoles)
      .filter(([clientId, config]) => {
        return (config as ConfigServiceRole).roles.length > 0;
      })
      .map(([clientId, config]) => {
        const roles = (config as ConfigServiceRole).roles;
        const roleNames = roles?.map((role) => {
          return role.role;
        });
        return { roleNames: roleNames, clientId: clientId, currentElements: null };
      });
  elements = elements.concat(clientElements);

  const ClientRole = ({ roleNames, clientId }) => {
    return (
      <ClientRoleTable
        roles={roleNames}
        clientId={clientId}
        anonymousRead={fileType?.anonymousRead}
        roleSelectFunc={(roles, type) => {
          if (type === 'read') {
            setFileType({
              ...fileType,
              readRoles: roles,
            });
          } else {
            setFileType({
              ...fileType,
              updateRoles: roles,
            });
          }
        }}
        service="FileType"
        nameColumnWidth={40}
        checkedRoles={[
          { title: 'read', selectedRoles: fileType?.readRoles },
          { title: 'modify', selectedRoles: fileType?.updateRoles },
        ]}
      />
    );
  };

  return (
    <FileTypeEditor data-testid="filetype-editor">
      {spinner ? (
        <PageLoader />
      ) : (
        <FlexRow>
          {customIndicator && <CustomLoader />}
          <NameDescriptionDataSchema>
            <FileTypeEditorTitle>File type</FileTypeEditorTitle>
            <hr className="hr-resize" />
            <FileTypeConfigDefinition fileType={fileType ?? FileTypeDefault} />
            <EditorPadding>
              <MakePublicPadding>
                <DropDownZIndex>
                  <GoAFormItem label="Select a security classification">
                    <GoADropdown
                      name="securityClassifications"
                      width="25rem"
                      value={fileType?.securityClassification}
                      relative={true}
                      onChange={(name: string, value: SecurityClassification) => {
                        setFileType({
                          ...fileType,
                          securityClassification: value,
                        });
                        if (
                          (fileType?.securityClassification !== undefined || value !== undefined) &&
                          fileType?.securityClassification !== '' &&
                          value !== SecurityClassification.Public &&
                          fileType?.anonymousRead
                        ) {
                          setIsSecurityClassificationCalloutIsOpen(true);
                        } else {
                          setIsSecurityClassificationCalloutIsOpen(false);
                        }
                      }}
                    >
                      <GoADropdownItem value={SecurityClassification.Public} label="Public" />
                      <GoADropdownItem value={SecurityClassification.ProtectedA} label="Protected A" />
                      <GoADropdownItem value={SecurityClassification.ProtectedB} label="Protected B" />
                      <GoADropdownItem value={SecurityClassification.ProtectedC} label="Protected C" />
                    </GoADropdown>
                  </GoAFormItem>
                  <div style={{ paddingTop: '0.625rem' }}>
                    <GoACheckbox
                      checked={fileType?.anonymousRead}
                      name="file-type-anonymousRead-checkbox"
                      testId="file-type-anonymousRead-checkbox"
                      ariaLabel={`file-type-anonymousRead-checkbox`}
                      onChange={() => {
                        //anonymousRead is false before it is updated in the useState(but in actually it has been changed)
                        if (
                          fileType?.securityClassification !== undefined &&
                          fileType?.securityClassification !== '' &&
                          fileType?.securityClassification !== SecurityClassification.Public &&
                          !fileType?.anonymousRead
                        ) {
                          setIsSecurityClassificationCalloutIsOpen(true);
                        } else {
                          setIsSecurityClassificationCalloutIsOpen(false);
                        }
                        setFileType({
                          ...fileType,
                          anonymousRead: !fileType.anonymousRead,
                        });
                      }}
                      text={'Make public (read only)'}
                    />
                  </div>
                </DropDownZIndex>
                {isSecurityClassificationCalloutOpen && (
                  <FileTypeEditorWarningCalloutWrapper>
                    <GoACallout type="important" heading="">
                      The protected file is publicly accessible.
                    </GoACallout>
                  </FileTypeEditorWarningCalloutWrapper>
                )}
              </MakePublicPadding>
              <GoAFormItem label="">
                <RetentionPolicyLabel>Retention policy</RetentionPolicyLabel>
                <GoATooltip
                  content="The untouched files within the file type will be deleted after the retention period provided."
                  position="right"
                >
                  <GoAIcon type="information-circle" ariaLabel="Retention policy"></GoAIcon>
                </GoATooltip>
                <RetentionPolicyWrapper>
                  <GoACheckbox
                    name="retentionActive"
                    key="retention-period-active-checkbox"
                    checked={fileType?.rules?.retention?.active === true}
                    onChange={(name, checked) => {
                      setFileType({
                        ...fileType,
                        rules: {
                          ...fileType?.rules,
                          retention: {
                            ...fileType?.rules?.retention,
                            active: checked,
                          },
                        },
                      });
                    }}
                    text={'Active retention policy'}
                  />
                  <RetentionPeriodText>Enter retention period</RetentionPeriodText>
                </RetentionPolicyWrapper>
              </GoAFormItem>
              <GoAInput
                onChange={(name, day) => {
                  if (parseInt(day) > 0) {
                    setFileType({
                      ...fileType,
                      rules: {
                        ...fileType?.rules,
                        retention: {
                          ...fileType?.rules?.retention,
                          deleteInDays: parseInt(day),
                          active: fileType?.rules?.retention?.active || false,
                          createdAt: fileType?.rules?.retention?.createdAt || new Date().toISOString(),
                        },
                      },
                    });
                  }
                }}
                testId={'delete-in-days-input'}
                name="delete-in-days"
                value={fileType?.rules?.retention?.deleteInDays?.toString()}
                type="number"
                disabled={fileType?.rules?.retention?.active !== true}
                aria-label="goa-input-delete-in-days"
                leadingContent="Days"
                width="265px"
              />
            </EditorPadding>
            <FinalButtonPadding>
              <hr className="hr-resize-bottom" />
              <br />
              <GoAButtonGroup alignment="start">
                <GoAButton
                  type="primary"
                  testId="form-save"
                  disabled={areObjectsEqual(initialFileType, fileType) || validators.haveErrors()}
                  onClick={() => {
                    if (indicator.show === true) {
                      setSpinner(true);
                    } else {
                      setCustomIndicator(true);
                      let elementNames = [];
                      elements.forEach((e) => {
                        if (e) {
                          elementNames = elementNames.concat(
                            e.roleNames?.map((roleName) => (e.clientId ? `${e.clientId}:${roleName}` : roleName))
                          );
                        }
                      });

                      const cleanReadRoles = fileType.readRoles.filter((readRole) => {
                        return elementNames.includes(readRole);
                      });
                      const cleanUpdateRoles = fileType.updateRoles.filter((updateRole) =>
                        elementNames.includes(updateRole)
                      );

                      //Default to Protected A if there was no security classification
                      if (!fileType?.securityClassification && fileType?.securityClassification?.length > 0) {
                        fileType.securityClassification = SecurityClassification.ProtectedA;
                      }

                      fileType.readRoles = cleanReadRoles;
                      fileType.updateRoles = cleanUpdateRoles;

                      dispatch(UpdateFileTypeService(fileType));
                    }
                  }}
                >
                  Save
                </GoAButton>
                <GoAButton
                  testId="form-cancel"
                  type="secondary"
                  onClick={() => {
                    if (!areObjectsEqual(initialFileType, fileType)) {
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
          <FileTypePermissions>
            <FileTypesEditorTitle>Roles</FileTypesEditorTitle>
            <hr className="hr-resize" />
            <ScrollPane ref={scrollPaneRef} className="roles-scroll-pane">
              {elements.map((e, key) => {
                return <ClientRole roleNames={e.roleNames} key={key} clientId={e.clientId} />;
              })}
              {fetchKeycloakRolesState === ActionState.inProcess && (
                <TextLoadingIndicator>Loading roles from access service</TextLoadingIndicator>
              )}
            </ScrollPane>
          </FileTypePermissions>
        </FlexRow>
      )}
      <SaveFormModal
        open={saveModal.visible}
        onDontSave={() => {
          setSaveModal({ visible: false, closeEditor: true });
        }}
        onSave={() => {
          setSpinner(true);
          setSaveModal({ visible: false, closeEditor: true });
        }}
        saveDisable={areObjectsEqual(initialFileType, fileType)}
        onCancel={() => {
          setSaveModal({ visible: false, closeEditor: false });
        }}
      />
    </FileTypeEditor>
  );
};
