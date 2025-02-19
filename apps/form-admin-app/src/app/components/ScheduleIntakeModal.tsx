import { GoAModal, GoAFormItem, GoAInputDateTime, GoADate, GoAButtonGroup, GoAButton } from '@abgov/react-components';
import { FunctionComponent, useState } from 'react';

interface ScheduleIntakeModalProps {
  open: boolean;
  onClose: () => void;
  onSchedule: (start: Date, end: Date) => Promise<void>;
}

export const ScheduleIntakeModal: FunctionComponent<ScheduleIntakeModalProps> = ({ open, onClose, onSchedule }) => {
  const [start, setStart] = useState<GoADate>();
  const [end, setEnd] = useState<GoADate>();

  return (
    <GoAModal heading="Schedule intake" open={open}>
      <form>
        <GoAFormItem label="Start on">
          <GoAInputDateTime onChange={(_, value: GoADate) => setStart(value)} value={start} name="Start on" />
        </GoAFormItem>
        <GoAFormItem label="End on">
          <GoAInputDateTime onChange={(_, value: GoADate) => setEnd(value)} min={start} value={end} name="End on" />
        </GoAFormItem>
      </form>
      <GoAButtonGroup alignment="end" mt="xl">
        <GoAButton type="secondary" onClick={onClose}>
          Close
        </GoAButton>
        <GoAButton
          disabled={!start || !end}
          onClick={async () =>
            await onSchedule(
              typeof start === 'string' ? new Date(start) : start,
              typeof end === 'string' ? new Date(end) : end
            )
          }
        >
          Schedule intake
        </GoAButton>
      </GoAButtonGroup>
    </GoAModal>
  );
};
