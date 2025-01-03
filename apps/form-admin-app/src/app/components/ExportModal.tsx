import { GoAButton, GoAButtonGroup, GoAFormItem, GoAModal, GoASpacer, GoASpinner } from '@abgov/react-components-new';
import { FunctionComponent } from 'react';

interface ExportModalProps {
  open: boolean;
  heading: string;
  state: { working: boolean; dataUri?: string; filename?: string };
  onClose: () => void;
  onStartExport: () => void;
}

export const ExportModal: FunctionComponent<ExportModalProps> = ({ open, heading, state, onClose, onStartExport }) => {
  return (
    <GoAModal heading={heading} open={open}>
      <form>
        {state.working ? (
          <>
            <div>
              <span>File download will be available once export is done. Export is in progress... </span>
            </div>
            <GoASpacer vSpacing="m" />
            <GoASpinner size="medium" type="infinite" />
          </>
        ) : (
          <div>
            <span>
              Click "Start export" to initiate export of records. You will be able to download the output file once
              export is complete.
            </span>
          </div>
        )}
        {state.dataUri && (
          <GoAFormItem label="Last exported file" mt="l">
            <a href={state.dataUri} download={state.filename}>
              {state.filename}
            </a>
          </GoAFormItem>
        )}
        <GoAButtonGroup alignment="end" mt="2xl">
          <GoAButton type="secondary" onClick={onClose}>
            Close
          </GoAButton>
          <GoAButton type="primary" onClick={onStartExport} disabled={state.working}>
            Start export
          </GoAButton>
        </GoAButtonGroup>
      </form>
    </GoAModal>
  );
};
