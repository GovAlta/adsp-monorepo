import axios from 'axios';
import { RegisterConfig } from './actions';
import get from 'lodash/get';

export const fetchRegister = async (props: RegisterConfig) => {
  let headers: Record<string, string> = {};
  const { token, responsePrefixPath, url, objectPathInArray } = props;

  if (token) {
    headers = { Authorization: `Bearer ${token}` };
  }

  if (url) {
    try {
      const res = await axios.get(url, { headers: headers });
      // eslint-disable-next-line
      const responseData: any[] = responsePrefixPath ? get(res.data, responsePrefixPath) : res.data;

      if (objectPathInArray) {
        return responseData?.map((d) => get(d, objectPathInArray));
      }

      return responseData;
    } catch (err) {
      console.warn(`Error in fetch enum register data from remote: ${err}`);
    }
  }

  return undefined;
};

interface Validate {
  url?: string;
}

export const validateUrl = async (props: Validate): Promise<boolean> => {
  const { url } = props;

  if (url) {
    try {
      await axios.get(url);

      return true;
    } catch (err) {
      console.warn(`Error in fetching data from remote: ${err}`);
      return false;
    }
  } else return false;
};
