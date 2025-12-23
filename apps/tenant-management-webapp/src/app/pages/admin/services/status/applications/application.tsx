import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { ServiceStatusType, PublicServiceStatusTypes, ApplicationStatus } from '@store/status/models';
import { deleteApplication, toggleApplicationStatus } from '@store/status/actions';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import {
  GoabButton,
  GoabButtonGroup,
  GoabRadioItem,
  GoabRadioGroup,
  GoabCheckbox,
  GoabBadge,
  GoabModal,
  GoabFormItem,
  GoabNotification,
} from '@abgov/react-components';
import { GoabBadgeType } from '@abgov/ui-components-common';
import ApplicationFormModal from '../form';

import { setApplicationStatus } from '@store/status/actions/setApplicationStatus';
import { DeleteModal } from '@components/DeleteModal';
import { HealthBar } from './healthBar';
import { App, AppHeader, AppHealth, AppStatus, AppName } from './styled-components';
import { saveApplication } from '@store/status/actions';
import { GoabRadioGroupOnChangeDetail } from '@abgov/ui-components-common';
export const Application = (app: ApplicationStatus): JSX.Element => {
  const dispatch = useDispatch();
  const entries = useSelector((state: RootState) =>
    state.serviceStatus.endpointHealth[app.appKey] &&
    state.serviceStatus.endpointHealth[app.appKey].url === app.endpoint?.url
      ? state.serviceStatus.endpointHealth[app.appKey].entries
      : []
  );

  if (app.endpoint) {
    app.endpoint.statusEntries = entries;
  }

  const { notices } = useSelector((state: RootState) => ({
    notices: state.notice?.notices,
  }));

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
  const [showStatusForm, setShowStatusForm] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [status, setStatus] = useState<ServiceStatusType | ''>(app.status);

  useEffect(() => {
    if (status !== app.status) {
      setStatus(app.status);
    }
  }, [app.status]); // eslint-disable-line react-hooks/exhaustive-deps

  function doDelete() {
    dispatch(deleteApplication({ tenantId: app.tenantId, appKey: app.appKey }));
    setShowDeleteConfirmation(false);
  }

  function cancelDelete() {
    setShowDeleteConfirmation(false);
  }

  function doManualStatusChange() {
    dispatch(setApplicationStatus({ tenantId: app.tenantId, appKey: app.appKey, status }));
    setShowStatusForm(false);
  }

  function cancelManualStatusChange() {
    setShowStatusForm(false);
  }

  function humanizeText(value: string): string {
    value = value.replace(/[\W]/, ' ');
    return value.substr(0, 1).toUpperCase() + value.substr(1);
  }

  const publicStatusMap: { [key: string]: GoabBadgeType } = {
    operational: 'success',
    maintenance: 'important',
    'reported-issues': 'emergency',
    outage: 'emergency',
    pending: 'light',
    disabled: 'light',
  };

  return (
    <App data-testid="application">
      {/* Main component content */}
      <AppHeader>
        <div>
          <AppStatus>
            <GoabButton
              type="tertiary"
              size="compact"
              testId="status-application-change-status"
              onClick={() => setShowStatusForm(true)}
            >
              Change status
            </GoabButton>
            {app.status && (
              <GoabBadge type={publicStatusMap[app.status]} content={humanizeText(app.status)} icon={false} />
            )}
          </AppStatus>
        </div>

        <GoAContextMenu>
          <GoAContextMenuIcon
            type="create"
            title="Edit"
            onClick={() => setShowEditModal(true)}
            testId="status-edit-button"
          />
          <GoAContextMenuIcon type="trash" title="Delete" onClick={() => setShowDeleteConfirmation(true)} />
        </GoAContextMenu>
      </AppHeader>
      {/* Endpoint List for watched service */}
      <AppName>{app.name}</AppName>
      <div>ID: {app.appKey}</div>
      <AppHealth>
        <HealthBar data-testid="endpoint" displayCount={30} app={app}></HealthBar>
        <GoabButton
          type="tertiary"
          size="compact"
          onClick={() => {
            dispatch(
              toggleApplicationStatus({
                tenantId: app.tenantId,
                appKey: app.appKey,
                enabled: !app.enabled,
              })
            );
          }}
        >
          {app.enabled ? 'Stop health check' : 'Start health check'}
        </GoabButton>
      </AppHealth>

      <GoabCheckbox
        checked={app.monitorOnly}
        name="monitor-only-checkbox"
        testId="monitor-only-checkbox"
        onChange={() => {
          const application: ApplicationStatus = JSON.parse(JSON.stringify(app));
          application.monitorOnly = !app.monitorOnly;
          dispatch(saveApplication(application));
        }}
        ariaLabel={`monitor-only-checkbox`}
      >
        Monitor only (the application will not be publicly displayed)
      </GoabCheckbox>

      <GoabCheckbox
        checked={app.autoChangeStatus}
        name="autoChangeStatus-checkbox"
        testId="autoChangeStatus-checkbox"
        onChange={() => {
          const application: ApplicationStatus = JSON.parse(JSON.stringify(app));
          application.autoChangeStatus = !app.autoChangeStatus;
          dispatch(saveApplication(application));
        }}
        ariaLabel={`autoChangeStatus-checkbox`}
      >
        Change status when site is unresponsive
      </GoabCheckbox>

      {/* GoabModals */}

      {/* Delete confirmation dialog */}

      <DeleteModal
        isOpen={showDeleteConfirmation}
        title="Delete application"
        content={
          <div>
            <div>
              Are you sure you wish to delete <b>{app.name}</b>?
            </div>

            <div>
              {notices &&
                notices.filter((notice) => notice.tennantServRef.map((ref) => ref.id).includes(app.appKey)).length >
                  0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <GoabNotification type="emergency">
                      This application has attached notices, and deleting it will orphan them
                    </GoabNotification>
                  </div>
                )}
            </div>
          </div>
        }
        onCancel={cancelDelete}
        onDelete={doDelete}
      />

      {/* Manual status change dialog */}
      <GoabModal open={showStatusForm} heading="Manual status change">
        <GoabFormItem label="">
          <GoabRadioGroup
            name="status"
            value={status}
            onChange={(detail: GoabRadioGroupOnChangeDetail) => setStatus(detail.value as ServiceStatusType)}
            orientation="vertical"
            testId="status-radio-group"
          >
            {PublicServiceStatusTypes.map((statusType) => (
              <GoabRadioItem key={statusType} name="status" value={statusType}></GoabRadioItem>
            ))}
          </GoabRadioGroup>
        </GoabFormItem>

        <GoabButtonGroup alignment="end">
          <GoabButton testId="application-cancel-button" type="secondary" onClick={cancelManualStatusChange}>
            Cancel
          </GoabButton>

          <GoabButton testId="application-save-button" type="primary" onClick={doManualStatusChange}>
            Save
          </GoabButton>
        </GoabButtonGroup>
      </GoabModal>
      <ApplicationFormModal
        isOpen={showEditModal}
        title="Edit application"
        isEdit={true}
        testId={'edit-application'}
        onCancel={() => {
          setShowEditModal(false);
        }}
        onSave={() => {
          setShowEditModal(false);
        }}
        defaultApplication={{ ...app }}
      />
    </App>
  );
};
