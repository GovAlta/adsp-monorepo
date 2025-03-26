import axios from 'axios';
import { RegisterConfig, UserContext, RegisterConfigData, USER_CONTEXT_DATA_URN } from './actions';
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
      const error = err as { message: string };
      console.warn(`Error in fetch enum register data from remote: ${err}`);
      return error.message;
    }
  }

  return undefined;
};

export const isValidHref = function (url: string) {
  const httpPattern = new RegExp(/^(http|https):\/\/[^ "]+$/);
  const mailToPattern = new RegExp(/^(mailto):[^ "]+$/);
  return httpPattern.test(url) || mailToPattern.test(url);
};

export const isMailToHref = function (url: string) {
  const mailToPattern = new RegExp(/^(mailto):[^ "]+$/);
  return mailToPattern.test(url);
};

export const createUserRegisterData = (userCtx: UserContext): RegisterConfigData => {
  return {
    urn: USER_CONTEXT_DATA_URN,
    data: userCtx,
  };
};
