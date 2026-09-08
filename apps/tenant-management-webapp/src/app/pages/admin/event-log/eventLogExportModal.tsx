import React, { FunctionComponent } from 'react';
import { GoabButton, GoabButtonGroup, GoabCircularProgress, GoabModal, GoabText } from '@abgov/react-components';
import styled from 'styled-components';

interface EventLogExportModalProps {
  open: boolean;
  isExporting: boolean;
  rowCount?: number;
  onCancel: () => void;
  onClose: () => void;
}

export const EventLogExportModal: FunctionComponent<EventLogExportModalProps> = ({
  open,
  isExporting,
  rowCount = 0,
  onCancel,
  onClose,
}) => {
  const rowLabel = rowCount === 1 ? 'row' : 'rows';
  return (
    <GoabModal
      testId="export-event-log-modal"
      open={open}
      heading="Export event log"
      actions={
        <GoabButtonGroup alignment="end">
          {isExporting ? (
            <GoabButton size="compact" type="secondary" testId="export-event-log-cancel" onClick={onCancel}>
              Cancel
            </GoabButton>
          ) : (
            <GoabButton size="compact" type="primary" testId="export-event-log-close" onClick={onClose}>
              Close
            </GoabButton>
          )}
        </GoabButtonGroup>
      }
    >
      {isExporting ? (
        <ExportProgress>
          <GoabCircularProgress visible={true} size="large" />
          <GoabText size="body-m" mb="none">
            Exporting event log...
          </GoabText>
        </ExportProgress>
      ) : (
        <GoabText size="body-m" mb="none">
          Export complete. {rowCount} {rowLabel} included in the CSV file.
        </GoabText>
      )}
    </GoabModal>
  );
};

const ExportProgress = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
`;
