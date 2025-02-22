import {
  GoAButton,
  GoAButtonGroup,
  GoAFormItem,
  GoAModal,
  GoARadioGroup,
  GoARadioItem,
  GoASpacer,
  GoASpinner,
} from '@abgov/react-components';
import { FunctionComponent, useState } from 'react';

interface ExportModalProps {
  open: boolean;
  heading: string;
  state: { working: boolean; dataUri?: string; filename?: string };
  onClose: () => void;
  onStartExport: (format: 'json' | 'csv') => void;
}

export const ExportModal: FunctionComponent<ExportModalProps> = ({ open, heading, state, onClose, onStartExport }) => {
  const [format, setFormat] = useState<'json' | 'csv'>('json');

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
          <>
            <div>
              <span>
                Click "Start export" to initiate export of records. You will be able to download the output file once
                export is complete.
              </span>
            </div>
            <GoAFormItem label="Export format" mt="l">
              <GoARadioGroup name="format" onChange={(_, value: 'json' | 'csv') => setFormat(value)} value={format}>
                <GoARadioItem value="json" label="JSON" />
                <GoARadioItem value="csv" label="CSV" />
              </GoARadioGroup>
            </GoAFormItem>
          </>
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
          <GoAButton type="primary" onClick={() => onStartExport(format)} disabled={state.working}>
            Start export
          </GoAButton>
        </GoAButtonGroup>
      </form>
    </GoAModal>
  );
};
