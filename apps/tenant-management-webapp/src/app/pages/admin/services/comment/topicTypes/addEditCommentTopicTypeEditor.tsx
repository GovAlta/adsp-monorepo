import React, { useState, useEffect } from 'react';

import { CommentTopicTypes } from '@store/comment/model';
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
  CommentPermissions,
  FinalButtonPadding,
  CommentEditorTitle,
  CommentEditor,
  ScrollPane,
  EditorPadding,
} from '../styled-components';
import { GoAPageLoader } from '@abgov/react-components';
import { FetchRealmRoles } from '@store/tenant/actions';
import { ConfigServiceRole } from '@store/access/models';
import { getCommentTopicTypes } from '@store/comment/action';
import { updateCommentTopicType } from '@store/comment/action';
import { GoADropdown, GoADropdownItem } from '@abgov/react-components-new';

import { createSelector } from 'reselect';

import { RootState } from '@store/index';
import { useSelector, useDispatch } from 'react-redux';
import { fetchKeycloakServiceRoles } from '@store/access/actions';
import { defaultCommentTopicType, SecurityClassification } from '@store/comment/model';
import { TopicConfigTopicType } from './topicConfigTopicType';

import { useHistory, useParams } from 'react-router-dom';

import { GoAButtonGroup, GoAButton, GoAFormItem } from '@abgov/react-components-new';
import { useWindowDimensions } from '@lib/useWindowDimensions';

const isCommentUpdated = (prev: CommentTopicTypes, next: CommentTopicTypes): boolean => {
  return (
    prev?.adminRoles !== next?.adminRoles ||
    prev?.commenterRoles !== next?.commenterRoles ||
    prev?.readerRoles !== next?.readerRoles ||
    prev?.securityClassification !== next?.securityClassification
  );
};

export function AddEditCommentTopicTypeEditor(): JSX.Element {
  const [topicType, setTopicType] = useState<CommentTopicTypes>(defaultCommentTopicType);
  const [initialTopicType, setInitialTopicType] = useState<CommentTopicTypes>(defaultCommentTopicType);
  const [spinner, setSpinner] = useState<boolean>(false);
  const { id } = useParams<{ id: string }>();
  const [saveModal, setSaveModal] = useState({ visible: false, closeEditor: false });

  const { height } = useWindowDimensions();

  const heightCover = {
    height: height - 561,
  };

  const isEdit = !!id;

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchKeycloakServiceRoles());
    dispatch(getCommentTopicTypes());
    dispatch(FetchRealmRoles());
  }, []);

  const types = [
    { type: 'adminRoles', name: 'Admin Roles' },
    { type: 'commenterRoles', name: 'Commenter Roles' },
    { type: 'readerRoles', name: 'Reader Roles' },
  ];

  const commentTopicTypes = useSelector((state: RootState) => state?.comment?.topicTypes || []);

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
    if (id && commentTopicTypes[id]) {
      setTopicType(commentTopicTypes[id]);
      setInitialTopicType(commentTopicTypes[id]);
    }
  }, [commentTopicTypes]);

  const history = useHistory();

  const close = () => {
    history.push({
      pathname: '/admin/services/comment',
      search: '?topicTypes=true',
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
          roleSelectFunc={(roles, type) => {
            if (type === applicantRoles.name) {
              setTopicType({
                ...topicType,
                adminRoles: roles,
              });
            } else if (type === clerkRoles.name) {
              setTopicType({
                ...topicType,
                commenterRoles: roles,
              });
            } else {
              setTopicType({
                ...topicType,
                readerRoles: roles,
              });
            }
          }}
          nameColumnWidth={40}
          service="FileType"
          checkedRoles={[
            { title: types[0].name, selectedRoles: topicType[types[0].type] },
            { title: types[1].name, selectedRoles: topicType[types[1].type] },
            { title: types[2].name, selectedRoles: topicType[types[2].type] },
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

  const topicTypes = useSelector((state: RootState) => {
    return state?.comment?.topicTypes;
  });
  const topicTypeIds = Object.keys(topicTypes);

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  useEffect(() => {
    if (spinner && Object.keys(topicTypes).length > 0) {
      if (validators['duplicate'].check(topicType.id)) {
        setSpinner(false);
        return;
      }

      setSpinner(false);
    }
  }, [topicTypes]);

  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);

  const { validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('name')
  )
    .add('duplicate', 'name', duplicateNameCheck(topicTypeIds, 'topicType'))
    .add('description', 'description', wordMaxLengthCheck(180, 'Description'))
    .build();
  return (
    <CommentEditor>
      {spinner ? (
        <SpinnerModalPadding>
          <GoAPageLoader visible={true} type="infinite" message={'Loading...'} pagelock={false} />
        </SpinnerModalPadding>
      ) : (
        <FlexRow>
          <NameDescriptionDataSchema>
            <CommentEditorTitle>Comment / Topic type editor</CommentEditorTitle>
            <hr className="hr-resize" />
            {topicType && <TopicConfigTopicType topicType={topicType} />}
            <GoAFormItem label="Security classification">
              <EditorPadding>
                <GoADropdown
                  name="Time period"
                  value={topicType.securityClassification}
                  onChange={(_n: string, value: SecurityClassification) =>
                    setTopicType({
                      ...topicType,
                      securityClassification: value,
                    })
                  }
                  width="25rem"
                >
                  <GoADropdownItem value={SecurityClassification.public} label="public" />
                  <GoADropdownItem value={SecurityClassification.protectedA} label="protected a" />
                  <GoADropdownItem value={SecurityClassification.protectedB} label="protected b" />
                  <GoADropdownItem value={SecurityClassification.protectedC} label="protected c" />
                </GoADropdown>
                {/* <Editor height={height - 550} /> */}
                <div style={heightCover}></div>
              </EditorPadding>
            </GoAFormItem>
            <hr className="hr-resize-bottom" />
            <FinalButtonPadding>
              <GoAButtonGroup alignment="start">
                <GoAButton
                  type="primary"
                  testId="comment-save"
                  disabled={
                    !isCommentUpdated(initialTopicType, topicType) || !topicType.name || validators.haveErrors()
                  }
                  onClick={() => {
                    if (indicator.show === true) {
                      setSpinner(true);
                    } else {
                      if (!isEdit) {
                        const validations = {
                          duplicate: topicType.name,
                        };
                        if (!validators.checkAll(validations)) {
                          return;
                        }
                      }
                      setSpinner(true);
                      dispatch(updateCommentTopicType(topicType));

                      close();
                    }
                  }}
                >
                  Save
                </GoAButton>
                <GoAButton
                  testId="comment-cancel"
                  type="secondary"
                  onClick={() => {
                    if (isCommentUpdated(initialTopicType, topicType)) {
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
          <CommentPermissions>
            <CommentEditorTitle>Roles</CommentEditorTitle>
            <hr className="hr-resize" />
            <ScrollPane>
              {elements.map((e, key) => {
                return <ClientRole roleNames={e.roleNames} key={key} clientId={e.clientId} />;
              })}
              {fetchKeycloakRolesState === ActionState.inProcess && (
                <TextLoadingIndicator>Loading roles from access service</TextLoadingIndicator>
              )}
            </ScrollPane>
          </CommentPermissions>
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
              duplicate: topicType.name,
            };
            if (!validators.checkAll(validations)) {
              return;
            }
          }
          setSpinner(true);
          dispatch(updateCommentTopicType(topicType));
          setSaveModal({ visible: false, closeEditor: true });
        }}
        saveDisable={!isCommentUpdated(initialTopicType, topicType)}
        onCancel={() => {
          setSaveModal({ visible: false, closeEditor: false });
        }}
      />
    </CommentEditor>
  );
}
