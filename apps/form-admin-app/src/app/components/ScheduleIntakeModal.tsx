import { GoabModal, GoabFormItem, GoabInputDateTime, GoabButtonGroup, GoabButton } from '@abgov/react-components';
import { GoabDate } from '@abgov/ui-components-common';
import { FunctionComponent, useState } from 'react';
import { GoabInputOnChangeDetail } from '@abgov/ui-components-common';

interface ScheduleIntakeModalProps {
  open: boolean;
  onClose: () => void;
  onSchedule: (start: Date, end: Date) => Promise<void>;
}

export const ScheduleIntakeModal: FunctionComponent<ScheduleIntakeModalProps> = ({ open, onClose, onSchedule }) => {
  const [start, setStart] = useState<GoabDate>();
  const [end, setEnd] = useState<GoabDate>();

  return (
    <GoabModal heading="Schedule intake" open={open}>
      <form>
        <GoabFormItem label="Start on">
          <GoabInputDateTime
            onChange={(detail: GoabInputOnChangeDetail) => setStart(detail.value)}
            value={start}
            name="Start on"
          />
        </GoabFormItem>
        <GoabFormItem label="End on">
          <GoabInputDateTime
            onChange={(detail: GoabInputOnChangeDetail) => setEnd(detail.value)}
            min={start}
            value={end}
            name="End on"
          />
        </GoabFormItem>
      </form>
      <GoabButtonGroup alignment="end" mt="xl">
        <GoabButton type="secondary" onClick={onClose}>
          Close
        </GoabButton>
        <GoabButton
          disabled={!start || !end}
          onClick={async () =>
            await onSchedule(
              typeof start === 'string' ? new Date(start) : start,
              typeof end === 'string' ? new Date(end) : end
            )
          }
        >
          Schedule intake
        </GoabButton>
      </GoabButtonGroup>
    </GoabModal>
  );
};
