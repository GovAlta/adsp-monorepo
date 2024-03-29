import React, { createContext } from 'react';
import axios, { AxiosRequestConfig, AxiosStatic } from 'axios';

interface enumerators {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Map<string, () => any>;
  functions: Map<string, () => (file: File, propertyId: string) => void>;
}

export interface AllData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any;
}

const getAxiosInterceptorConfig = (axios: AxiosStatic): [number, AxiosStatic] => {
  const requestId = axios.interceptors.request.use((req) => {
    if (req.data === undefined) {
      throw new Error(`The URL: ${req.url} encountered a CORS error.`);
    }
    return req;
  });

  return [requestId, axios];
};

export function addDataByUrl(key: string, url: string, processDataFunction: (url: string) => string[], token?: string) {
  let header = {} as AxiosRequestConfig<unknown>;
  const [requestId, axiosWithConfig] = getAxiosInterceptorConfig(axios);
  if (token) {
    header = { ...header, ...{ Authorization: `Bearer ${token}` } };
  }

  axiosWithConfig
    .get(url, header)
    .then((response) => {
      const processedData = processDataFunction(response.data);
      enumValues.set(key, () => processedData);
    })
    .catch((err: Error) => {
      if (err.message.includes('CORS')) {
        console.warn(err.message);
      } else {
        console.warn(`addDataByUrl: ${err.message}`);
      }
    });
  axiosWithConfig.interceptors.request.eject(requestId);
}

export function addDataByOptions(key: string, url: string, location: string[], type: string, values: string[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dataFunction = (data: any) => {
    let dataLink = data;
    let returnData = [''];

    const locationArray = location && !Array.isArray(location) ? [location] : location;
    locationArray?.forEach((attribute) => {
      dataLink = dataLink[attribute];
    });

    const valuesArray = Array.isArray(values) ? values : [values];

    if (type === 'keys') {
      returnData = Object.keys(dataLink);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      returnData = dataLink.map((entry: any) => {
        let parse = '';
        valuesArray.forEach((v, index) => {
          parse += `${entry[v]}`;

          if (index < valuesArray.length - 1) {
            parse += ' ';
          }
        });
        return parse;
      });
    }

    return returnData;
  };

  addDataByUrl(key, url, dataFunction);
}

interface FileManagement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fileList?: any;
  uploadFile?: (file: File, propertyId: string) => void;
  downloadFile?: (file: File) => void;
  deleteFile?: (file: File) => void;
}

type Props = {
  children?: React.ReactNode;
  fileManagement?: FileManagement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const enumValues: Map<string, () => Record<string, any> | string[]> = new Map<string, () => Record<string, any>>();
const enumFunctions: Map<string, () => (file: File, propertyId: string) => void> = new Map<
  string,
  () => (file: File, propertyId: string) => void
>();

const baseEnumerator = {
  data: enumValues,
  functions: enumFunctions,
};

export const JsonFormContext = createContext(baseEnumerator);

export function ContextProvider(props: Props): JSX.Element | null {
  const outerTheme = React.useContext(JsonFormContext);

  if (props.fileManagement) {
    const { fileList, uploadFile, downloadFile, deleteFile } = props.fileManagement;

    /* eslint-disable @typescript-eslint/no-empty-function */
    const uploadFileFunction = uploadFile ? uploadFile : () => {};
    const downloadFileFunction = downloadFile ? downloadFile : () => {};
    const deleteFileFunction = deleteFile ? deleteFile : () => {};

    enumValues.set('file-list', () => fileList);

    enumFunctions.set('upload-file', () => uploadFileFunction);
    enumFunctions.set('download-file', () => downloadFileFunction);
    enumFunctions.set('delete-file', () => deleteFileFunction);
  }

  if (props.data) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props.data?.forEach((item: any) => {
      enumValues.set(Object.keys(item)[0], () => item);
    });
  }

  if (!props.children) {
    return null;
  }

  return <JsonFormContext.Provider value={baseEnumerator}>{props.children}</JsonFormContext.Provider>;
}

/**
 * Grabs data stored under a given key
 *
 */
export function getData(key: string) {
  const dataFunction = baseEnumerator.data.get(key);
  return dataFunction && dataFunction();
}

/**
 * Grabs all data
 *
 */
export function getAllData() {
  const allData: AllData = [];
  baseEnumerator.data.forEach((d, key) => {
    allData.push({ [key]: d() });
  });
  return allData;
}
/**
 * Allows additional data to be added under a given key
 *
 * This data will then be available inside the context
 */
export function addData(key: string, data: Record<string, unknown> | unknown[]) {
  enumValues.set(key, () => data);
}
