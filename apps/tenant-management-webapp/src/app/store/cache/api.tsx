import axios from 'axios';
import { CacheTarget } from './model';

export const fetchCacheTargetsApi = async (token: string, url: string): Promise<Record<string, CacheTarget>> => {
  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const fetchCacheTargetApi = async (
  token: string,
  serviceUrl: string,
  definitionId: string
): Promise<CacheTarget | null> => {
  const { data } = await axios.get<CacheTarget>(
    new URL(`configuration/v2/configuration/form-service/${definitionId}/latest`, serviceUrl).href,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return data?.id ? data : null;
};
