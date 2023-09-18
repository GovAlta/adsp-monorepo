import React, { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import {
  EditorPadding,
  FileTypeEditor,
  FileTypeEditorTitle,
  FileTypePermissions,
  FileTypesEditorTitle,
  FinalButtonPadding,
  FlexRow,
  NameDescriptionDataSchema,
  ScrollPane,
  SpinnerModalPadding,
  TextLoadingIndicator,
} from './styled-components';
import { useWindowDimensions } from '@lib/useWindowDimensions';
import { useDispatch, useSelector } from 'react-redux';
import { GoAButton, GoAPageLoader } from '@abgov/react-components';
import { FileTypeConfigDefinition } from './fileTypeConfigDefinition';
import { GoAButtonGroup, GoAFormItem } from '@abgov/react-components-new';
import { FetchFileTypeService } from '@store/file/actions';
import { RootState } from '@store/index';
import { FileTypeDefault, FileTypeItem } from '@store/file/models';
import { useValidators } from '@lib/validation/useValidators';
import { badCharsCheck, duplicateNameCheck, isNotEmptyCheck, wordMaxLengthCheck } from '@lib/validation/checkInput';
import { createSelector } from 'reselect';
import { ConfigServiceRole } from '@store/access/models';
import { FETCH_KEYCLOAK_SERVICE_ROLES } from '@store/access/actions';
import { ActionState } from '@store/session/models';
import { ClientRoleTable } from '@components/RoleTable';

export const AddEditFileTypeDefinitionEditor = (): JSX.Element => {
  const dispatch = useDispatch();
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [spinner, setSpinner] = useState<boolean>(false);
  const [saveModal, setSaveModal] = useState({ visible: false, closeEditor: false });
  const [initialFileType, setInitialFileType] = useState<FileTypeItem>(FileTypeDefault);
  //const [isAnonymous, setIsAnonymous] = useState(false);

  const { height } = useWindowDimensions();
  const heightCover = {
    height: height - 480,
  };

  const selectServiceKeycloakRoles = createSelector(
    (state: RootState) => state.serviceRoles,
    (serviceRoles) => {
      return serviceRoles?.keycloak || {};
    }
  );

  const roles = useSelector((state: RootState) => state.tenant.realmRoles);

  const keycloakClientRoles = useSelector(selectServiceKeycloakRoles);
  let elements = [{ roleNames: [], clientId: '', currentElements: null }];
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

  const ClientRole = ({ roleNames, clientId }) => {
    return (
      <>
        <ClientRoleTable
          roles={roleNames}
          clientId={clientId}
          anonymousRead={filteredFileType?.anonymousRead}
          roleSelectFunc={(roles, type) => {
            if (type === 'read') {
              // setFileType({
              //   ...fileType,
              //   readRoles: roles,
              // });
            } else {
              // setFileType({
              //   ...fileType,
              //   updateRoles: roles,
              // });
            }
          }}
          service="FileType"
          nameColumnWidth={80}
          checkedRoles={[
            { title: 'read', selectedRoles: filteredFileType?.readRoles },
            { title: 'modify', selectedRoles: filteredFileType?.updateRoles },
          ]}
        />
      </>
    );
  };

  const fileTypes: FileTypeItem[] = useSelector((state: RootState) => state.fileService.fileTypes);

  const { fetchKeycloakRolesState } = useSelector((state: RootState) => ({
    fetchKeycloakRolesState: state.session.indicator?.details[FETCH_KEYCLOAK_SERVICE_ROLES] || '',
  }));

  if (fetchKeycloakRolesState !== ActionState.inProcess) {
    console.log('elements', elements);
  }

  //eslint-disable-next-line
  useEffect(() => {}, [fetchKeycloakRolesState]);

  useEffect(() => {
    dispatch(FetchFileTypeService());
  }, []);

  const filteredFileType = fileTypes?.find((f) => f.id === id);
  let fileTypeIds = [];
  if (fileTypes) {
    fileTypeIds = Object.keys(fileTypes ?? []);
  }

  const { validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('name')
  )
    .add('duplicate', 'name', duplicateNameCheck(fileTypeIds, 'filetype'))
    .add('description', 'description', wordMaxLengthCheck(180, 'Description'))
    .build();
  const isFileTypeUpdated = (prev: FileTypeItem, next: FileTypeItem): boolean => {
    return (
      prev?.readRoles !== next?.readRoles ||
      prev?.updateRoles !== next?.updateRoles ||
      prev?.anonymousRead !== next?.anonymousRead ||
      JSON.stringify(prev?.rules?.retention) !== JSON.stringify(next?.rules?.retention)
    );
  };

  return (
    <FileTypeEditor data-testid="filetype-editor">
      {spinner ? (
        <SpinnerModalPadding>
          <GoAPageLoader visible={true} type="infinite" message={'Loading...'} pagelock={false} />
        </SpinnerModalPadding>
      ) : (
        <FlexRow>
          <NameDescriptionDataSchema>
            <FileTypeEditorTitle>File Type</FileTypeEditorTitle>
            <hr className="hr-resize" />

            <FileTypeConfigDefinition fileType={filteredFileType ?? FileTypeDefault} />
            <GoAFormItem label="">
              <EditorPadding>
                <div style={heightCover}></div>
              </EditorPadding>
            </GoAFormItem>
            <hr className="hr-resize-bottom" />
            <FinalButtonPadding>
              <GoAButtonGroup alignment="start">
                <GoAButton
                  type="primary"
                  testId="form-save"
                  disabled={
                    !isFileTypeUpdated(initialFileType, filteredFileType) ||
                    !filteredFileType?.name ||
                    validators.haveErrors()
                  }
                  onClick={() => {
                    // if (indicator.show === true) {
                    //   setSpinner(true);
                    // } else {
                    //   if (!isEdit) {
                    //     const validations = {
                    //       duplicate: queue.name,
                    //     };
                    //     if (!validators.checkAll(validations)) {
                    //       return;
                    //     }
                    //   }
                    //   setSpinner(true);
                    //   dispatch(UpdateTaskQueue(queue));
                    //   close();
                    // }
                  }}
                >
                  Save
                </GoAButton>
                <GoAButton
                  testId="form-cancel"
                  type="secondary"
                  onClick={() => {
                    history.push({
                      pathname: '/admin/services/file',
                    });
                    // if (isTaskUpdated(initialDefinition, queue)) {
                    //   validators.clear();
                    //   close();
                    // } else {
                    //   setSaveModal({ visible: true, closeEditor: false });
                    // }
                  }}
                >
                  Back
                </GoAButton>
              </GoAButtonGroup>
            </FinalButtonPadding>
          </NameDescriptionDataSchema>
          <FileTypePermissions className="task-permissions-wrapper">
            <FileTypesEditorTitle>File Type permissions</FileTypesEditorTitle>
            <hr className="hr-resize" />
            <ScrollPane>
              {fetchKeycloakRolesState === ActionState.inProcess ? (
                <TextLoadingIndicator>Loading roles from access service</TextLoadingIndicator>
              ) : (
                elements?.map((e, key) => {
                  return <ClientRole roleNames={e.roleNames} key={key} clientId={e.clientId} />;
                })
              )}
            </ScrollPane>
          </FileTypePermissions>
        </FlexRow>
      )}
    </FileTypeEditor>
  );
};
