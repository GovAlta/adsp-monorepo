import React, { useEffect } from 'react';
import {
  Modal,
  HideTablet,
  FormTemplateEditorContainer,
  OuterFormTemplateEditorContainer,
  IndicatorBox,
} from '../styled';
import { ModalContent } from '../../styled';
import { useNavigate, useParams } from 'react-router-dom';
import { AddEditFormDefinitionEditor } from './addEditFormDefinitionEditor';
import { TabletMessage } from '../components/TabletMessage';
import { useDispatch, useSelector } from 'react-redux';
import { openEditorForDefinition } from '../store/form/action';
import { RootState } from '../store';
import { initializeFormEditor } from '../store/form/action';
import { modifiedDefinitionSelector } from '../store/form/selectors';
import { rolesSelector } from '../store/access/selectors';
import { PageIndicator } from '../components/Indicator';
import { NotificationBanner } from '../components/notificationBanner';

import { GoACircularProgress } from '@abgov/react-components';

export const FormDefinitionEditor = (): JSX.Element => {
  const navigate = useNavigate();

  const selectedId = useSelector((state: RootState) => state.form.editor.selectedId);
  const realmRoles = useSelector((state: RootState) => state.tenant.realmRoles);
  const fileTypes = useSelector((state: RootState) => state.fileService.fileTypes);
  const config = useSelector((state: RootState) => state.config);
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  useEffect(() => {
    if (id !== selectedId && Object.keys(config).length > 0) {
      dispatch(openEditorForDefinition(id));
    }
  }, [config]);

  const queueTasks = useSelector((state: RootState) => state.task?.queues);
  const definition = useSelector(modifiedDefinitionSelector);
  const roles = useSelector(rolesSelector);

  useEffect(() => {
    if (Object.keys(config).length > 0) {
      dispatch(initializeFormEditor());
    }
  }, [dispatch, config]);

  const latestNotification = useSelector(
    (state: RootState) => state.notifications.notifications[state.notifications.notifications.length - 1]
  );

  const isNotificationActive = latestNotification && !latestNotification.disabled;
  return (
    <Modal data-testid="template-form">
      <NotificationBanner />
      <ModalContent>
        <OuterFormTemplateEditorContainer>
          <TabletMessage goBack={() => navigate('/admin/services/form?definitions=true')} />

          <HideTablet>
            <FormTemplateEditorContainer>
              {definition?.id && realmRoles && queueTasks && fileTypes ? (
                <AddEditFormDefinitionEditor
                  key={id}
                  definition={definition}
                  roles={roles}
                  queueTasks={queueTasks}
                  fileTypes={fileTypes}
                />
              ) : (
                <IndicatorBox>
                  <PageIndicator />
                  <GoACircularProgress visible={true} message="Loading..." size="large" />
                  {/* <GoACircularProgress visible={true} message="Loading..." size="large" />; */}
                </IndicatorBox>
              )}
            </FormTemplateEditorContainer>
          </HideTablet>
        </OuterFormTemplateEditorContainer>
      </ModalContent>
    </Modal>
  );
};
