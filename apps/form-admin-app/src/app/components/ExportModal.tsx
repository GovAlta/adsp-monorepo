import {
  GoabButton,
  GoabButtonGroup,
  GoabFormItem,
  GoabModal,
  GoabRadioGroup,
  GoabRadioItem,
  GoabSpacer,
  GoabSpinner,
} from '@abgov/react-components';
import { FunctionComponent, useState } from 'react';
import { GoabRadioGroupOnChangeDetail } from '@abgov/ui-components-common';
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
    <GoabModal heading={heading} open={open}>
      <form>
        {state.working ? (
          <>
            <div>
              <span>File download will be available once export is done. Export is in progress... </span>
            </div>
            <GoabSpacer vSpacing="m" />
            <GoabSpinner size="medium" type="infinite" />
          </>
        ) : (
          <>
            <div>
              <span>
                Click "Start export" to initiate export of records. You will be able to download the output file once
                export is complete.
              </span>
            </div>
            <GoabFormItem label="Export format" mt="l">
              <GoabRadioGroup
                name="format"
                onChange={(detail: GoabRadioGroupOnChangeDetail) => setFormat(detail.value as 'json' | 'csv')}
                value={format}
              >
                <GoabRadioItem value="json" label="JSON" />
                <GoabRadioItem value="csv" label="CSV" />
              </GoabRadioGroup>
            </GoabFormItem>
          </>
        )}
        {state.dataUri && (
          <GoabFormItem label="Last exported file" mt="l">
            <a href={state.dataUri} download={state.filename}>
              {state.filename}
            </a>
          </GoabFormItem>
        )}
        <GoabButtonGroup alignment="end" mt="2xl">
          <GoabButton type="secondary" onClick={onClose}>
            Close
          </GoabButton>
          <GoabButton type="primary" onClick={() => onStartExport(format)} disabled={state.working}>
            Start export
          </GoabButton>
        </GoabButtonGroup>
      </form>
    </GoabModal>
  );
};
