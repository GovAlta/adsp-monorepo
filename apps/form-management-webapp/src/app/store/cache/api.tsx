import axios from 'axios';
import { CacheTarget } from './model';

export const fetchCacheTargetsApi = async (token: string, url: string): Promise<Record<string, CacheTarget>> => {
  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const updateCacheTargetApi = async (token: string, serviceUrl: string, targets: Record<string, CacheTarget>) => {
  const { data } = await axios.patch<{ latest: { configuration: Record<string, CacheTarget> } }>(
    new URL(`configuration/v2/configuration/platform/cache-service`, serviceUrl).href,
    { operation: 'REPLACE', configuration: { targets: targets } },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return data;
};
