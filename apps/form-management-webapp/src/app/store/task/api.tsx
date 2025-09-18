import axios from 'axios';
import { TaskDefinition, DeleteTaskConfig, QueueTaskDefinition } from './model';

export const fetchTaskQueuesApi = async (token: string, url: string): Promise<Record<string, TaskDefinition>> => {
  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const deleteTaskQueuesApi = async (token: string, url: string, body: DeleteTaskConfig) => {
  const res = await axios.patch(url, body, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};
export const getTasksApi = async (token: string, url: string) => {
  const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};
export const updateQueueTaskApi = async (token: string, url: string, body: QueueTaskDefinition) => {
  const res = await axios.patch(url, body, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};
export const postTasksApi = async (token: string, url: string, body: QueueTaskDefinition) => {
  const res = await axios.post(url, body, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};
