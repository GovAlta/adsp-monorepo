import { GoASpinner } from '@abgov/react-components-new';
import { FunctionComponent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import {
  AppDispatch,
  assignTask,
  busySelector,
  filterSelector,
  liveSelector,
  modalSelector,
  openTaskSelector,
  queueUserSelector,
  queueWorkersSelector,
  metricsSelector,
  tasksSelector,
  initializeQueue,
  setTaskPriority,
  taskActions,
  metricsLoadingSelector,
} from '../state';
import { TaskAssignmentModal } from '../components/TaskAssignmentModal';
import { TaskPriorityModal } from '../components/TaskPriorityModal';
import { TaskHeader } from '../components/TaskHeader';
import { TaskList } from '../components/TaskList';
import { TaskDetailsHost } from './details/TaskDetailsHost';

const Loading = styled.div`
  flex-grow: 2;
  flex-shrink: 0;
  height: 80vh;
  display: flex;
  > * {
    margin: auto;
  }
`;

interface TaskQueueComponentProps {
  className?: string;
}

const TaskQueueComponent: FunctionComponent<TaskQueueComponentProps> = ({ className }) => {
  const user = useSelector(queueUserSelector);
  const live = useSelector(liveSelector);
  const metrics = useSelector(metricsSelector);
  const metricsLoading = useSelector(metricsLoadingSelector);
  const filter = useSelector(filterSelector);
  const busy = useSelector(busySelector);
  const modal = useSelector(modalSelector);
  const tasks = useSelector(tasksSelector);
  const open = useSelector(openTaskSelector);
  const workers = useSelector(queueWorkersSelector);

  const dispatch = useDispatch<AppDispatch>();
  const params = useParams<{ namespace: string; name: string }>();

  useEffect(() => {
    dispatch(initializeQueue({ namespace: params.namespace, name: params.name }));
  }, [dispatch, params]);

  return (
    <div className={className}>
      <TaskHeader open={open} isLive={live} onClickTasks={() => dispatch(taskActions.setOpenTask())} />
      <TaskDetailsHost />
      {busy.initializing ||
        (busy.loading && (
          <Loading>
            <GoASpinner size="large" type="infinite" />
          </Loading>
        ))}
      <TaskList
        metrics={metrics}
        metricsLoading={metricsLoading[`${params.namespace}:${params.name}`]}
        filter={filter}
        tasks={tasks}
        open={open}
        selected={null}
        user={user}
        onSetFilter={(filter) => dispatch(taskActions.setFilter(filter))}
        onSelect={() => {
          // not used
        }}
        onAssign={(task) => dispatch(taskActions.setTaskToAssign(task))}
        onSetPriority={(task) => dispatch(taskActions.setTaskToPrioritize(task))}
        onOpen={(task) => dispatch(taskActions.setOpenTask(task.id))}
      />
      <TaskAssignmentModal
        user={user}
        task={modal.taskToAssign}
        workers={workers}
        open={!!modal.taskToAssign}
        executing={busy.executing}
        onAssign={(assignTo) => dispatch(assignTask({ taskId: modal.taskToAssign.id, assignTo }))}
        onClose={() => dispatch(taskActions.setTaskToAssign(null))}
      />
      <TaskPriorityModal
        task={modal.taskToPrioritize}
        open={!!modal.taskToPrioritize}
        executing={busy.executing}
        onSetPriority={(priority) =>
          dispatch(
            setTaskPriority({
              taskId: modal.taskToPrioritize.id,
              priority,
            })
          )
        }
        onClose={() => dispatch(taskActions.setTaskToPrioritize(null))}
      />
    </div>
  );
};

const TaskQueue = styled(TaskQueueComponent)`
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
`;

export default TaskQueue;
