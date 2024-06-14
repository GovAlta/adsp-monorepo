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

export const isValidHref = function (url: string) {
  const httPattern = new RegExp(/^(http|https):\/\/[^ "]+$/);
  const mailToPattern = new RegExp(/^(mailto):[^ "]+$/);
  return httPattern.test(url) || mailToPattern.test(url);
};
