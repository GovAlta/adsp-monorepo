import axios from 'axios';
import { TaskDefinition } from './model';

export const fetchTaskQueuesApi = async (token: string, url: string): Promise<Record<string, TaskDefinition>> => {
  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
