import {
  GoabButton,
  GoabButtonGroup,
  GoabDropdown,
  GoabDropdownItem,
  GoabFormItem,
  GoabModal,
} from '@abgov/react-components';
import { FunctionComponent, useEffect, useState } from 'react';
import { Person, Task, TaskUser } from '../state';
import { GoabInputOnChangeDetail } from '@abgov/ui-components-common';

interface TaskAssignmentModalProps {
  user: TaskUser;
  task: Task;
  open: boolean;
  workers: Person[];
  executing: boolean;
  onAssign: (assignTo: Person) => void;
  onClose: () => void;
}

export const TaskAssignmentModal: FunctionComponent<TaskAssignmentModalProps> = ({
  user,
  task,
  workers,
  open,
  executing,
  onAssign,
  onClose,
}) => {
  const [selected, setSelected] = useState<string>();
  useEffect(() => {
    setSelected(task?.assignment?.assignedTo?.id || '');
  }, [task]);

  return (
    <GoabModal heading="Assign task" open={open} onClose={onClose}>
      <form>
        <p>Assign task {task?.name} to a person. Only the assigned person will be able to progress the task.</p>
        <div>
          {task?.assignment?.assignedTo ? (
            <>
              <span>Task is currently assigned to: </span>
              <span>{task.assignment.assignedTo.name}</span>
            </>
          ) : (
            <span>Task is currently not assigned.</span>
          )}
        </div>
        {user.isAssigner ? (
          <GoabFormItem label="Assign task to" mt="m" mb="4xl">
            <GoabDropdown
              value={task?.assignment?.assignedTo?.id}
              onChange={(detail: GoabInputOnChangeDetail) => setSelected(detail.value as string)}
              width={'50ch'}
            >
              <GoabDropdownItem key="no one" value="" label="No one" />
              {workers.map((w) => (
                <GoabDropdownItem key={w.id} value={w.id} label={w.name} />
              ))}
            </GoabDropdown>
          </GoabFormItem>
        ) : (
          <div>Assign this task to yourself?</div>
        )}
        <GoabButtonGroup alignment="end" mt="4xl">
          <GoabButton type="secondary" onClick={onClose}>
            Cancel
          </GoabButton>
          <GoabButton
            disabled={executing || (user.isAssigner && selected === (task?.assignment?.assignedTo?.id || ''))}
            type="primary"
            onClick={() => {
              onAssign(user.isAssigner ? (selected ? workers.find((w) => w.id === selected) : null) : user);
            }}
          >
            Assign
          </GoabButton>
        </GoabButtonGroup>
      </form>
    </GoabModal>
  );
};
