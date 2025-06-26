import React, { FunctionComponent, useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  TextLoadingIndicator,
  FlexRow,
  NameDescriptionDataSchema,
  TaskPermissions,
  EditorPadding,
  FinalButtonPadding,
  TaskEditorTitle,
  TaskEditor,
  ScrollPane,
} from '../styled-components';
import { tenantRolesAndClients } from '@store/sharedSelectors/roles';
import { UpdateTaskQueue, getTaskQueues } from '@store/task/action';
import { ClientRoleTable } from '@components/RoleTable';
import { GoAButtonGroup, GoAFormItem, GoAButton } from '@abgov/react-components';
import { PageIndicator } from '@components/Indicator';
import { TaskDefinition, defaultTaskQueue } from '@store/task/model';
import { ServiceRoleConfig } from '@store/access/models';
import { ConfigServiceRole } from '@store/access/models';
import { RootState } from '@store/index';
import { FETCH_KEYCLOAK_SERVICE_ROLES, fetchKeycloakServiceRoles } from '@store/access/actions';
import { ActionState } from '@store/session/models';
import { compareStringArrayAreEqual } from '@lib/objectUtil';
import { useValidators } from '@lib/validation/useValidators';
import { badCharsCheck, wordMaxLengthCheck, isNotEmptyCheck, duplicateNameCheck } from '@lib/validation/checkInput';
import { TaskConfigQueue } from './TaskConfigQueue';
import { SaveFormModal } from '@components/saveModal';
import useWindowDimensions from '@lib/useWindowDimensions';
import { FetchRealmRoles } from '@store/tenant/actions';
import { CustomLoader } from '@components/CustomLoader';

const isTaskUpdated = (prev: TaskDefinition, next: TaskDefinition): boolean =>
  compareStringArrayAreEqual(prev?.assignerRoles, next?.assignerRoles) &&
  compareStringArrayAreEqual(prev?.workerRoles, next?.workerRoles);

export const QueueModalEditor: FunctionComponent = (): JSX.Element => {
  const dispatch = useDispatch();
  const [queue, setQueue] = useState<TaskDefinition>(defaultTaskQueue);
  const [initialDefinition, setInitialQueue] = useState<TaskDefinition>(defaultTaskQueue);
  const [spinner, setSpinner] = useState<boolean>(false);
  const [customIndicator, setCustomIndicator] = useState<boolean>(false);
  const tenant = useSelector(tenantRolesAndClients);
  const tenantClients: ServiceRoleConfig = tenant.tenantClients ? tenant.tenantClients : {};
  const { id } = useParams<{ id: string }>();
  const latestNotification = useSelector(
    (state: RootState) => state.notifications.notifications[state.notifications.notifications.length - 1]
  );
  const { height } = useWindowDimensions();
  const calcHeight = latestNotification && !latestNotification.disabled ? height - 8 : height + 42;
  const [saveModal, setSaveModal] = useState({ visible: false, closeEditor: false });
  const scrollPaneRef = useRef<HTMLDivElement>(null);
  const isEdit = !!id;
  const heightCover = {
    height: calcHeight - 550,
  };

  useEffect(() => {
    dispatch(getTaskQueues());
    dispatch(FetchRealmRoles());
    dispatch(fetchKeycloakServiceRoles());
  }, [dispatch]);
  const navigate = useNavigate();

  const close = () => {
    navigate('/admin/services/task?queues=true', { state: { isNavigatedFromEdit: true } });
  };

  useEffect(() => {
    if (saveModal.closeEditor) {
      close();
    }
  }, [saveModal]); // eslint-disable-line react-hooks/exhaustive-deps

  const queues = useSelector((state: RootState) => state?.task?.queues || []);

  useEffect(() => {
    if (id && queues[id]) {
      const selectedQueue = queues[id];
      setQueue(selectedQueue);
      setInitialQueue(selectedQueue);
    }
    setCustomIndicator(false);
  }, [queues]); // eslint-disable-line react-hooks/exhaustive-deps

  const { fetchKeycloakRolesState } = useSelector((state: RootState) => ({
    fetchKeycloakRolesState: state.session.indicator?.details[FETCH_KEYCLOAK_SERVICE_ROLES] || '',
  }));

  const types = [
    { type: 'assignerRoles', name: 'Assigner roles' },
    { type: 'workerRoles', name: 'Worker roles' },
  ];

  const assignerRoles = types[0];
  const workerRoles = types[1];

  //eslint-disable-next-line
  useEffect(() => {}, [fetchKeycloakRolesState]);
  const ClientRole = ({ roleNames, clientId }) => {
    return (
      <ClientRoleTable
        roles={roleNames}
        clientId={clientId}
        roleSelectFunc={(roles, type) => {
          if (type === assignerRoles.name) {
            setQueue({
              ...queue,
              assignerRoles: roles,
            });
          } else {
            setQueue({
              ...queue,
              workerRoles: roles,
            });
          }
        }}
        nameColumnWidth={40}
        service="Queue"
        checkedRoles={[
          { title: assignerRoles.name, selectedRoles: queue[assignerRoles.type] },
          { title: workerRoles.name, selectedRoles: queue[workerRoles.type] },
        ]}
      />
    );
  };

  const roles = useSelector((state: RootState) => state.tenant.realmRoles) || [];

  const roleNames = roles.map((role) => {
    return role.name;
  });

  let elements = [{ roleNames: roleNames, clientId: '', currentElements: null }];

  const clientElements =
    tenantClients &&
    Object.entries(tenantClients).length > 0 &&
    Object.entries(tenantClients)
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

  const definitionIds = Object.keys(queues);

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const { validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('name')
  )
    .add('duplicate', 'name', duplicateNameCheck(definitionIds, 'definition'))
    .add('description', 'description', wordMaxLengthCheck(180, 'Description'))
    .build();

  useEffect(() => {
    if (spinner && Object.keys(queues).length > 0) {
      if (validators['duplicate'].check(queue.id)) {
        setSpinner(false);
        return;
      }

      setSpinner(false);
    }
  }, [queues]); // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);

  return (
    <TaskEditor>
      {spinner ? (
        <PageIndicator />
      ) : (
        <FlexRow>
          {customIndicator && <CustomLoader />}
          <NameDescriptionDataSchema>
            <TaskEditorTitle>Queue</TaskEditorTitle>
            <hr className="hr-resize" />
            {queue && <TaskConfigQueue queue={queue} />}

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
                  testId="queue-save"
                  disabled={isTaskUpdated(initialDefinition, queue) || validators.haveErrors()}
                  onClick={() => {
                    if (indicator.show === true) {
                      setSpinner(true);
                    } else {
                      if (!isEdit) {
                        const validations = {
                          duplicate: queue.name,
                        };
                        if (!validators.checkAll(validations)) {
                          return;
                        }
                      }
                      setCustomIndicator(true);
                      dispatch(UpdateTaskQueue(queue));
                    }
                  }}
                >
                  Save
                </GoAButton>
                <GoAButton
                  testId="queue-cancel"
                  type="secondary"
                  onClick={() => {
                    if (isTaskUpdated(initialDefinition, queue)) {
                      validators.clear();
                      close();
                    } else {
                      setSaveModal({ visible: true, closeEditor: false });
                    }
                  }}
                >
                  Back
                </GoAButton>
              </GoAButtonGroup>
            </FinalButtonPadding>
          </NameDescriptionDataSchema>
          <TaskPermissions className="task-permissions-wrapper">
            <TaskEditorTitle>Queue permissions</TaskEditorTitle>
            <hr className="hr-resize" />
            <ScrollPane ref={scrollPaneRef} className="roles-scroll-pane">
              {tenantClients &&
                elements.map((e, key) => {
                  return <ClientRole roleNames={e.roleNames} key={key} clientId={e.clientId} />;
                })}
              {fetchKeycloakRolesState === ActionState.inProcess && (
                <TextLoadingIndicator>Loading roles from access service</TextLoadingIndicator>
              )}
            </ScrollPane>
          </TaskPermissions>
        </FlexRow>
      )}
      <SaveFormModal
        open={saveModal.visible}
        onDontSave={() => {
          close();
          setSaveModal({ visible: false, closeEditor: true });
        }}
        onSave={() => {
          if (!isEdit) {
            const validations = {
              duplicate: queue.name,
            };
            if (!validators.checkAll(validations)) {
              return;
            }
          }
          setSpinner(true);
          dispatch(UpdateTaskQueue(queue));
          setSaveModal({ visible: false, closeEditor: true });
        }}
        saveDisable={isTaskUpdated(initialDefinition, queue)}
        onCancel={() => {
          setSaveModal({ visible: false, closeEditor: false });
        }}
      />
    </TaskEditor>
  );
};
