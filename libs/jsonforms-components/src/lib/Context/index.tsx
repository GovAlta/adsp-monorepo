import { createContext } from 'react';
import axios, { AxiosRequestConfig } from 'axios';

interface enumerators {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Map<string, () => any>;
  functions: Map<string, () => (file: File, propertyId: string) => void>;
}

export interface AllData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any;
}

export class Context {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fileList: any;
  uploadFile: (file: File, propertyId: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  downloadFile: (file: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deleteFile: (file: any) => void;
  enumFunctions: Map<string, () => (file: File, propertyId: string) => void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  enumValues: Map<string, () => Record<string, any> | string[]>;
  baseEnumerator: enumerators;
  jsonFormContext: React.Context<enumerators>;

  constructor() {
    this.fileList = null;
    /* eslint-disable @typescript-eslint/no-empty-function */
    this.uploadFile = () => {};
    this.downloadFile = () => {};
    this.deleteFile = () => {};
    /* eslint-enable @typescript-eslint/no-empty-function */

    this.enumFunctions = new Map<string, () => (file: File, propertyId: string) => void>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.enumValues = new Map<string, () => Record<string, any>>();

    this.baseEnumerator = {
      data: this.enumValues,
      functions: this.enumFunctions,
    };

    this.jsonFormContext = createContext(this.baseEnumerator);
  }

  setFileManagement(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fileList: any,
    uploadFile: (file: File, propertyId: string) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    downloadFile: (file: any) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deleteFile: (file: any) => void
  ): void {
    this.fileList = fileList;
    this.uploadFile = uploadFile;
    this.downloadFile = downloadFile;
    this.deleteFile = deleteFile;

    this.enumValues.set('file-list', () => this.fileList);
    this.enumFunctions.set('upload-file', () => this.uploadFile);
    this.enumFunctions.set('download-file', () => this.downloadFile);
    this.enumFunctions.set('delete-file', () => this.deleteFile);
  }

  /**
   * Allows additional data to be added under a given key
   *
   * This data will then be available inside the context
   */
  addData(key: string, data: Record<string, unknown> | unknown[]) {
    this.enumValues.set(key, () => data);
  }
  addDataByUrl(key: string, url: string, processDataFunction: (url: string) => string[], token?: string) {
    let header = { 'Content-Type': 'application/json' } as AxiosRequestConfig<unknown>;

    if (token) {
      header = { ...header, ...{ Authorization: `Bearer ${token}` } };
    }

    axios
      .get(url, header)
      .then((response) => {
        const processedData = processDataFunction(response.data);
        this.enumValues.set(key, () => processedData);
      })
      .catch((e) => console.log('Error: ' + JSON.stringify(e)));
  }

  addDataByOptions(key: string, url: string, location: string[], type: string, values: string[]) {
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

    this.addDataByUrl(key, url, dataFunction);
  }

  /**
   * Grabs data stored under a given key
   *
   */
  getData(key: string) {
    const dataFunction = this.baseEnumerator.data.get(key);
    return dataFunction && dataFunction();
  }

  /**
   * Grabs all data
   *
   */
  getAllData() {
    const allData: AllData = [];
    this.baseEnumerator.data.forEach((d, key) => {
      allData.push({ [key]: d() });
    });
    return allData;
  }
}

export const JsonFormContextInstance = new Context();
