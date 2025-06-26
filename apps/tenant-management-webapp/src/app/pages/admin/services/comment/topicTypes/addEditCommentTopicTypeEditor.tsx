import React, { useState, useEffect, useRef } from 'react';

import { CommentTopicTypes } from '@store/comment/model';
import { useValidators } from '@lib/validation/useValidators';
import {
  isNotEmptyCheck,
  wordMaxLengthCheck,
  badCharsCheck,
  duplicateNameCheck,
  isNotUndefinedCheck,
} from '@lib/validation/checkInput';
import { FETCH_KEYCLOAK_SERVICE_ROLES } from '@store/access/actions';
import { ActionState } from '@store/session/models';
import { ClientRoleTable } from '@components/RoleTable';
import { SaveFormModal } from '@components/saveModal';
import {
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
import { PageIndicator } from '@components/Indicator';

import { FetchRealmRoles } from '@store/tenant/actions';

import { ConfigServiceRole } from '@store/access/models';
import { getCommentTopicTypes } from '@store/comment/action';
import { updateCommentTopicType } from '@store/comment/action';

import { createSelector } from 'reselect';

import { RootState } from '@store/index';
import { useSelector, useDispatch } from 'react-redux';
import { fetchKeycloakServiceRoles } from '@store/access/actions';
import { defaultCommentTopicType, defaultEditCommentTopicType, SecurityClassification } from '@store/comment/model';
import { TopicConfigTopicType } from './topicConfigTopicType';

import { useNavigate, useParams } from 'react-router-dom';

import { GoAButtonGroup, GoAButton, GoAFormItem, GoADropdown, GoADropdownItem } from '@abgov/react-components';
import { useWindowDimensions } from '@lib/useWindowDimensions';
import { CustomLoader } from '@components/CustomLoader';

const isCommentUpdated = (prev: CommentTopicTypes, next: CommentTopicTypes): boolean => {
  return (
    prev?.adminRoles !== next?.adminRoles ||
    prev?.commenterRoles !== next?.commenterRoles ||
    prev?.readerRoles !== next?.readerRoles ||
    prev?.securityClassification !== next?.securityClassification
  );
};

export function AddEditCommentTopicTypeEditor(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const [topicType, setTopicType] = useState<CommentTopicTypes>(
    id ? defaultEditCommentTopicType : defaultCommentTopicType
  );
  const [initialTopicType, setInitialTopicType] = useState<CommentTopicTypes>(defaultCommentTopicType);
  const [spinner, setSpinner] = useState<boolean>(false);
  const [customIndicator, setCustomIndicator] = useState<boolean>(false);

  const [saveModal, setSaveModal] = useState({ visible: false, closeEditor: false });
  const latestNotification = useSelector(
    (state: RootState) => state.notifications.notifications[state.notifications.notifications.length - 1]
  );
  const scrollPaneRef = useRef<HTMLDivElement>(null);
  const { height } = useWindowDimensions();
  const calcHeight = latestNotification && !latestNotification.disabled ? height - 8 : height;

  const isEdit = !!id;

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchKeycloakServiceRoles());
    dispatch(FetchRealmRoles());
    dispatch(getCommentTopicTypes());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const types = [
    { type: 'adminRoles', name: 'Admin roles' },
    { type: 'commenterRoles', name: 'Commenter roles' },
    { type: 'readerRoles', name: 'Reader roles' },
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
  }, [saveModal]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (id && commentTopicTypes[id]) {
      const topicTypes = JSON.parse(JSON.stringify(commentTopicTypes[id]));
      if (!topicTypes.securityClassification) {
        topicTypes.securityClassification = undefined;
      }
      setTopicType(topicTypes);
      setInitialTopicType(topicTypes);
      setCustomIndicator(false);
    }
  }, [commentTopicTypes]); // eslint-disable-line react-hooks/exhaustive-deps

  const navigate = useNavigate();

  const close = () => {
    navigate('/admin/services/comment?topicTypes=true');
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
      <ClientRoleTable
        roles={roleNames}
        clientId={clientId}
        roleSelectFunc={(roles, type) => {
          if (type === applicantRoles.name) {
            setTopicType((prev) => ({ ...prev, adminRoles: roles }));
          } else if (type === clerkRoles.name) {
            setTopicType((prev) => ({ ...prev, commenterRoles: roles }));
          } else {
            setTopicType((prev) => ({ ...prev, readerRoles: roles }));
          }
        }}
        nameColumnWidth={40}
        service="Comment"
        checkedRoles={[
          { title: types[0].name, selectedRoles: topicType[types[0].type] },
          { title: types[1].name, selectedRoles: topicType[types[1].type] },
          { title: types[2].name, selectedRoles: topicType[types[2].type] },
        ]}
      />
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
  const topicTypeNames = Object.values(topicTypes).map((val) => {
    return val.name;
  });

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
  }, [topicTypes]); // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);

  const { validators, errors } = useValidators(
    'name',
    'name',
    badCharsCheck,
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('name'),
    isNotEmptyCheck('securityClassification')
  )
    .add('duplicate', 'name', duplicateNameCheck(topicTypeNames, 'topicType'))
    .add(
      'securityClassification',
      'securityClassification',
      isNotUndefinedCheck(topicType.securityClassification, 'Security classification')
    )
    .add('description', 'description', wordMaxLengthCheck(180, 'Description'))
    .build();

  const heightCover = {
    height: calcHeight - 550,
  };

  return (
    <CommentEditor>
      {spinner ? (
        <PageIndicator />
      ) : (
        <FlexRow>
          {customIndicator && <CustomLoader />}
          <NameDescriptionDataSchema>
            <CommentEditorTitle>Comment / Topic type editor</CommentEditorTitle>
            <hr className="hr-resize" />
            {topicType && <TopicConfigTopicType topicType={topicType} />}

            <EditorPadding>
              <div style={heightCover}>
                <GoAFormItem error={errors?.['securityClassification']} label="Select a security classification">
                  <GoADropdown
                    name="securityClassifications"
                    value={topicType?.securityClassification}
                    onChange={(_n: string, value: SecurityClassification) => {
                      validators['securityClassification'].check(value);
                      setTopicType({
                        ...topicType,
                        securityClassification: value,
                      });
                    }}
                    relative={true}
                    width="25rem"
                  >
                    <GoADropdownItem value={SecurityClassification.public} label="Public" />
                    <GoADropdownItem value={SecurityClassification.protectedA} label="Protected A" />
                    <GoADropdownItem value={SecurityClassification.protectedB} label="Protected B" />
                    <GoADropdownItem value={SecurityClassification.protectedC} label="Protected C" />
                  </GoADropdown>
                </GoAFormItem>
              </div>
            </EditorPadding>

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
                      } else {
                        const validations = {
                          securityClassification: topicType.securityClassification,
                        };
                        if (!validators.checkAll(validations)) {
                          return;
                        }
                      }
                      setCustomIndicator(true);
                      setInitialTopicType({ ...topicType });
                      dispatch(updateCommentTopicType({ ...topicType }));
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
            <ScrollPane ref={scrollPaneRef} className="roles-scroll-pane">
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
          } else {
            const validations = {
              securityClassification: topicType.securityClassification,
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
