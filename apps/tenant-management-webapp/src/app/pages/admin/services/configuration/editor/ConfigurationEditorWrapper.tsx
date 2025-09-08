import React, { useState } from 'react';
import {
  RightTemplateContainer,
  TemplateEditorContainer,
  OuterTemplateEditorContainer,
  Modal,
  HideTablet,
  ModalContent,
  NotificationBannerWrapper,
} from '../styled-components';
import { ConfigurationEditor } from './ConfigurationEditor';
import { ConfigurationData } from './ConfigurationData';

import { useNavigate } from 'react-router-dom';
import { TabletMessage } from '@components/TabletMessage';
import { RootState } from '@store/index';
import { useSelector } from 'react-redux';
import { NotificationBanner } from 'app/notificationBanner';

export const ConfigurationEditorWrapper = (): JSX.Element => {
  const navigate = useNavigate();

  const goBack = () => {
    navigate('/admin/services/pdf?templates=true');
  };

  const latestNotification = useSelector(
    (state: RootState) => state.notifications.notifications[state.notifications.notifications.length - 1]
  );

  const isNotificationActive = latestNotification && !latestNotification.disabled;
  const [configurationData, setConfigurationData] = useState('');
  const [dataError, setDataError] = useState('');

  return (
    <>
      <NotificationBannerWrapper>
        <NotificationBanner />
      </NotificationBannerWrapper>
      <Modal data-testid="template-form" isNotificationActive={isNotificationActive}>
        <ModalContent>
          <OuterTemplateEditorContainer>
            <TabletMessage goBack={goBack} />
            <HideTablet>
              <TemplateEditorContainer>
                <RightTemplateContainer>
                  <ConfigurationEditor configurationData={configurationData} dataError={dataError} />
                </RightTemplateContainer>

                <RightTemplateContainer>
                  <ConfigurationData
                    setDataError={setDataError}
                    dataError={dataError}
                    configurationData={configurationData}
                    setConfigurationData={setConfigurationData}
                  />
                </RightTemplateContainer>
              </TemplateEditorContainer>
            </HideTablet>
          </OuterTemplateEditorContainer>
        </ModalContent>
      </Modal>
    </>
  );
};
