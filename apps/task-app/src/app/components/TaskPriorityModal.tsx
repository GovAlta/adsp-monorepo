import { GoAButton, GoAButtonGroup, GoAFormItem, GoAModal, GoARadioGroup, GoARadioItem } from '@abgov/react-components';
import { FunctionComponent, useEffect, useState } from 'react';
import { Task } from '../state';

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
    <GoAModal heading="Set task priority" open={open} onClose={onClose}>
      <form>
        <p>Set the priority for {task?.name}. Higher priority tasks will appear at the top of the list.</p>
        <div>
          <span>Priority is currently set to: </span>
          <span>{task?.priority}</span>
        </div>
        <GoAFormItem label="Set priority to" mt="m">
          <GoARadioGroup name="priority" value={task?.priority} onChange={(_, value) => setPriority(value)}>
            <GoARadioItem name="Urgent" value="Urgent" />
            <GoARadioItem name="High" value="High" />
            <GoARadioItem name="Normal" value="Normal" />
          </GoARadioGroup>
        </GoAFormItem>
        <GoAButtonGroup alignment="end" mt="4xl">
          <GoAButton type="secondary" onClick={onClose}>
            Cancel
          </GoAButton>
          <GoAButton
            type="primary"
            disabled={executing || (priority && priority === task?.priority)}
            onClick={() => onSetPriority(priority)}
          >
            Set priority
          </GoAButton>
        </GoAButtonGroup>
      </form>
    </GoAModal>
  );
};

export default TaskPriorityModal;
