import axios from 'axios';
import { CommentTopicTypes, UpdateCommentConfig } from './model';

export const fetchCommentTopicTypesApi = async (
  token: string,
  url: string
): Promise<Record<string, CommentTopicTypes>> => {
  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const updateCommentTopicTypesApi = async (token: string, url: string, body: UpdateCommentConfig) => {
  const res = await axios.patch(url, body, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};
