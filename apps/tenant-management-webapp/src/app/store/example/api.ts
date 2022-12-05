import axios from 'axios';

export const fetchDirectories = async (url: string, token: string) => {
  const { data: coreDirectory } = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return coreDirectory;
};
