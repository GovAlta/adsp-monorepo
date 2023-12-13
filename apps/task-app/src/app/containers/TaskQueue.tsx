import { GoAButton, GoAButtonGroup, GoACallout, GoADetails, GoASpinner } from '@abgov/react-components-new';
import { FunctionComponent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  AppDispatch,
  assignTask,
  cancelTask,
  completeTask,
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
  startTask,
  taskActions,
} from '../state';
import { TaskAssignmentModal } from '../components/TaskAssignmentModal';
import { TaskDetails } from '../components/TaskDetails';
import { TaskPriorityModal } from '../components/TaskPriorityModal';
import { TaskHeader } from '../components/TaskHeader';
import { TaskList } from '../components/TaskList';

import styles from './TaskQueue.module.css';
import { useParams } from 'react-router-dom';

export const TaskQueue: FunctionComponent = () => {
  const user = useSelector(queueUserSelector);
  const live = useSelector(liveSelector);
  const metrics = useSelector(metricsSelector);
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
    <div className={styles.taskList}>
      <TaskHeader
        className={styles.header}
        open={open}
        isLive={live}
        onClickTasks={() => dispatch(taskActions.setOpenTask())}
      />
      <TaskDetails className={styles.details} open={open}>
        {/* <TaskContainer className={styles.detailsPlaceholder} task={open} /> */}
        {/* Replace this with task detail view so user can view and complete task. */}
        <div className={styles.detailsPlaceholder}>
          <div>
            <GoACallout type="information" heading="Task detail view">
              This is a placeholder for the task detail view. Replace with your own custom view for the specific type of
              task that users will work with.
            </GoACallout>
            <GoADetails ml="s" heading="Show task specific view">
              Replace this with a custom view so user can view and perform tasks. For example, if the task is to process
              a submission, show the form fields and attached files for the assessor.
            </GoADetails>
            <GoADetails ml="s" heading="Update task based on user actions">
              Tasks can be started, completed, and cancelled. Perform task lifecycle actions as part of the task
              specific user action. For example, if the task is to process a submission, the assessor's action to record
              a decision should complete the task.
            </GoADetails>
          </div>
          <GoAButtonGroup alignment="end" mt="l">
            <GoAButton type="secondary" onClick={() => dispatch(taskActions.setOpenTask())}>
              Close
            </GoAButton>
            {open?.status === 'Pending' && (
              <GoAButton
                disabled={!user.isWorker || busy.executing}
                onClick={() => dispatch(startTask({ taskId: open?.id }))}
              >
                Start task
              </GoAButton>
            )}
            {open?.status === 'In Progress' && (
              <>
                <GoAButton
                  type="secondary"
                  disabled={!user.isWorker || busy.executing}
                  onClick={() => dispatch(cancelTask({ taskId: open?.id, reason: null }))}
                >
                  Cancel task
                </GoAButton>
                <GoAButton
                  disabled={!user.isWorker || busy.executing}
                  onClick={() => dispatch(completeTask({ taskId: open?.id }))}
                >
                  Complete task
                </GoAButton>
              </>
            )}
          </GoAButtonGroup>
        </div>
      </TaskDetails>
      {busy.initializing ||
        (busy.loading && (
          <div className={styles.loading}>
            <GoASpinner size="large" type="infinite" />
          </div>
        ))}
      <TaskList
        className={styles.list}
        metrics={metrics}
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
