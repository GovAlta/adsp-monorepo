import axios from 'axios';
import { CommentTopicTypes, UpdateCommentConfig, DeleteCommentConfig } from './model';

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

export const deleteCommentTopicTypesApi = async (token: string, url: string, body: DeleteCommentConfig) => {
  const res = await axios.patch(url, body, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};
export const fetchTopicTypesApi = async (url, token) => {
  const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
  return response.data;
};

export const addTopicApi = async (token, url, topicData) => {
  const response = await axios.post(url, topicData, { headers: { Authorization: `Bearer ${token}` } });
  return response.data;
};

export const fetchTopicsApi = async (url, token) => {
  const response = await axios.get(`${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const fetchCommentsApi = async (token, url) => {
  const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
  return response.data;
};
export const addCommentApi = async (token, url, commentData) => {
  const response = await axios.post(url, commentData, { headers: { Authorization: `Bearer ${token}` } });
  return response.data;
};
export const updateCommentApi = async (token, url, commentData) => {
  const response = await axios.patch(url, commentData, { headers: { Authorization: `Bearer ${token}` } });
  return response.data;
};

export const deleteTopicApi = async (token, url) => {
  const response = await axios.delete(`${url}`, { headers: { Authorization: `Bearer ${token}` } });
  return response.data;
};

export const deleteCommentApi = async (token, url) => {
  const response = await axios.delete(`${url}/`, { headers: { Authorization: `Bearer ${token}` } });
  return response.data;
};
