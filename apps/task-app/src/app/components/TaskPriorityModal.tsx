import {
  GoabButton,
  GoabButtonGroup,
  GoabFormItem,
  GoabModal,
  GoabRadioGroup,
  GoabRadioItem,
} from '@abgov/react-components';
import { FunctionComponent, useEffect, useState } from 'react';
import { Task } from '../state';
import { GoabRadioGroupOnChangeDetail } from '@abgov/ui-components-common';
interface TaskPriorityModal {
  task: Task;
  open: boolean;
  executing: boolean;
  onSetPriority: (priority: string) => void;
  onClose: () => void;
}

export const TaskPriorityModal: FunctionComponent<TaskPriorityModal> = ({
  task,
  open,
  executing,
  onSetPriority,
  onClose,
}) => {
  const [priority, setPriority] = useState<string>();
  useEffect(() => {
    setPriority(task?.priority);
  }, [task]);

  return (
    <GoabModal heading="Set task priority" open={open} onClose={onClose}>
      <form>
        <p>Set the priority for {task?.name}. Higher priority tasks will appear at the top of the list.</p>
        <div>
          <span>Priority is currently set to: </span>
          <span>{task?.priority}</span>
        </div>
        <GoabFormItem label="Set priority to" mt="m">
          <GoabRadioGroup
            name="priority"
            value={task?.priority}
            onChange={(detail: GoabRadioGroupOnChangeDetail) => setPriority(detail.value)}
          >
            <GoabRadioItem name="Urgent" value="Urgent" />
            <GoabRadioItem name="High" value="High" />
            <GoabRadioItem name="Normal" value="Normal" />
          </GoabRadioGroup>
        </GoabFormItem>
        <GoabButtonGroup alignment="end" mt="4xl">
          <GoabButton type="secondary" onClick={onClose}>
            Cancel
          </GoabButton>
          <GoabButton
            type="primary"
            disabled={executing || (priority && priority === task?.priority)}
            onClick={() => onSetPriority(priority)}
          >
            Set priority
          </GoabButton>
        </GoabButtonGroup>
      </form>
    </GoabModal>
  );
};

export default TaskPriorityModal;
