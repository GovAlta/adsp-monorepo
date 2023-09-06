import React, { useEffect, useState } from 'react';
import { RootState } from '@store/index';
import { useDispatch, useSelector } from 'react-redux';
import { getTaskQueues } from '@store/task/action';
import { PageIndicator } from '@components/Indicator';
import { defaultTaskQueue } from '@store/task/model';
import { renderNoItem } from '@components/NoItem';
import { QueueListTable } from './queueTable';

export const QueueList = () => {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [currentDefinition, setCurrentDefinition] = useState(defaultTaskQueue);
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const taskQueues = useSelector((state: RootState) => {
    return Object.entries(state?.task?.queues)
      .sort((template1, template2) => {
        return template1[1].name.localeCompare(template2[1].name);
      })
      .reduce((tempObj, [formDefinitionId, formDefinitionData]) => {
        tempObj[formDefinitionId] = formDefinitionData;
        return tempObj;
      }, {});
  });

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getTaskQueues());
  }, []);

  return (
    <section>
      <p>QueuesList</p>
      <br />
      <br />
      <PageIndicator />
      {JSON.stringify(taskQueues)}
      {!indicator.show && !taskQueues && renderNoItem('task queues')}
      {!indicator.show && taskQueues && (
        <TaskQueuesTable
          taskQueues={taskQueues}
          onDelete={(currentTemplate) => {
            setShowDeleteConfirmation(true);
            setCurrentDefinition(currentTemplate);
          }}
        />
      )}
    </section>
  );
};

export default QueueList;
