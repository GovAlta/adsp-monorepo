import axios from 'axios';
import { CacheTarget } from './model';

export const fetchCacheTargetsApi = async (token: string, url: string): Promise<Record<string, CacheTarget>> => {
  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const updateCacheTargetApi = async (token: string, serviceUrl: string, target: CacheTarget) => {
  console.log(JSON.stringify(target) + '<target');
  const { data } = await axios.patch<{ latest: { configuration: Record<string, CacheTarget> } }>(
    new URL(`configuration/v2/configuration/cache-service/${target.urn}`, serviceUrl).href,
    { operation: 'REPLACE', configuration: target },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return data;
};
