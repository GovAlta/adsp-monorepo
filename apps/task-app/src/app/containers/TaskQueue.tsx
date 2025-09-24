import { FunctionComponent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';
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
  openTask,
  loadQueueMetrics,
  AppState,
} from '../state';
import { TaskAssignmentModal } from '../components/TaskAssignmentModal';
import { TaskPriorityModal } from '../components/TaskPriorityModal';
import { TaskHeader } from '../components/TaskHeader';
import { TaskList } from '../components/TaskList';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { TaskDetailsHost } from './details/TaskDetailsHost';

interface TaskQueueComponentProps {
  className?: string;
}

const TaskQueueComponent: FunctionComponent<TaskQueueComponentProps> = ({ className }) => {
  const params = useParams<{ tenant: string; namespace: string; name: string }>();

  const user = useSelector(queueUserSelector);
  const live = useSelector(liveSelector);
  const metrics = useSelector(metricsSelector);
  const metricsLoading = useSelector(metricsLoadingSelector);
  const filter = useSelector(filterSelector);
  const busy = useSelector(busySelector);
  const modal = useSelector(modalSelector);
  const tasks = useSelector((state: AppState) => tasksSelector(state, params.namespace, params.name));
  const open = useSelector(openTaskSelector);
  const workers = useSelector(queueWorkersSelector);

  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(initializeQueue({ namespace: params.namespace, name: params.name }));
    dispatch(loadQueueMetrics({ namespace: params.namespace, name: params.name }));
    dispatch(openTask({ namespace: params.namespace, name: params.name }));
  }, [dispatch, params]);

  const navigate = useNavigate();

  return (
    <div className={className}>
      <LoadingIndicator isLoading={busy.initializing || busy.loading} />
      <TaskHeader
        open={open}
        isLive={live}
        onClickTasks={() => navigate('')}
        namespace={params.namespace}
        name={params.name}
      />
      <Routes>
        <Route path={`/:taskId`} element={<TaskDetailsHost onClose={() => navigate('')} />} />
        <Route
          path="/"
          element={
            tasks && (
              <TaskList
                metrics={metrics}
                metricsLoading={metricsLoading[`${params.namespace}:${params.name}`]}
                filter={filter}
                tasks={tasks}
                open={open}
                selected={null}
                user={user}
                initializingUser={busy.initializingUser}
                onSetFilter={(filter) => dispatch(taskActions.setFilter(filter))}
                onSelect={() => {
                  // not used
                }}
                onAssign={(task) => dispatch(taskActions.setTaskToAssign(task.id))}
                onSetPriority={(task) => dispatch(taskActions.setTaskToPrioritize(task.id))}
                onOpen={(task) => navigate(`${task.id}`)}
              />
            )
          }
        />
      </Routes>
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
