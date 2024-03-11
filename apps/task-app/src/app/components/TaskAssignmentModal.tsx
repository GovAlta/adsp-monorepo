import {
  GoAButton,
  GoAButtonGroup,
  GoADropdown,
  GoADropdownItem,
  GoAFormItem,
  GoAModal,
} from '@abgov/react-components-new';
import { FunctionComponent, useEffect, useState } from 'react';
import { Person, Task, TaskUser } from '../state';

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
    <GoAModal heading="Assign task" open={open} onClose={onClose}>
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
          <GoAFormItem label="Assign task to" mt="m" mb="4xl">
            <GoADropdown
              value={task?.assignment?.assignedTo?.id}
              onChange={(_, id) => setSelected(id as string)}
              relative={true}
              width={'50ch'}
            >
              <GoADropdownItem key="no one" value="" label="No one" />
              {workers.map((w) => (
                <GoADropdownItem key={w.id} value={w.id} label={w.name} />
              ))}
            </GoADropdown>
          </GoAFormItem>
        ) : (
          <div>Assign this task to yourself?</div>
        )}
        <GoAButtonGroup alignment="end" mt="4xl">
          <GoAButton type="secondary" onClick={onClose}>
            Cancel
          </GoAButton>
          <GoAButton
            disabled={executing || (user.isAssigner && selected === (task?.assignment?.assignedTo?.id || ''))}
            type="primary"
            onClick={() => {
              onAssign(user.isAssigner ? (selected ? workers.find((w) => w.id === selected) : null) : user);
            }}
          >
            Assign
          </GoAButton>
        </GoAButtonGroup>
      </form>
    </GoAModal>
  );
};
