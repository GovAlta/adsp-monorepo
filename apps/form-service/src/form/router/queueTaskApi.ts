import axios from 'axios';
import { TaskQueueToProcess } from '../types';
import { QueueTaskDefinition } from '../model/queueTask';

export const createTaskForQueueApi = async (
  token: string,
  url: string,
  body: QueueTaskDefinition,
  taskQueueToProcess: TaskQueueToProcess
) => {
  const taskServiceUrl = `${url}/${taskQueueToProcess.queueNameSpace}/${taskQueueToProcess.queueName}/tasks`;
  const res = await axios.post(taskServiceUrl, body, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};
