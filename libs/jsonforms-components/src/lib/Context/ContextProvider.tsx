import React, { createContext, useContext } from 'react';
import axios, { AxiosRequestConfig, AxiosStatic } from 'axios';

interface AllData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any;
}

export interface enumerators {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Map<string, () => any>;
  functions: Map<string, () => (file: File, propertyId: string) => void | undefined>;
  submitFunction: Map<string, () => (id: string) => void | undefined>;
  saveFunction: Map<string, () => (id: string) => void | undefined>;
  addFormContextData: (key: string, data: Record<string, unknown> | unknown[]) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getFormContextData: (key: string) => Record<string, any>;
  getAllFormContextData: () => AllData;
  isFormSubmitted: boolean;
  formUrl: string;
}

export interface FileManagement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fileList?: any;
  uploadFile?: (file: File, propertyId: string) => void;
  downloadFile?: (file: File) => void;
  deleteFile?: (file: File) => void;
}
export interface SubmitManagement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submitForm?: (any: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  saveForm?: (any: any) => void;
}

type Props = {
  children?: React.ReactNode;
  fileManagement?: FileManagement;
  submit?: SubmitManagement;
  isFormSubmitted?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formUrl?: string | null | undefined;
};

export class ContextProviderClass {
  selfProps: Props | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  enumValues: Map<string, () => Record<string, any>> = new Map<string, () => Record<string, any>>();
  enumFunctions: Map<string, () => ((file: File, propertyId: string) => void) | undefined> = new Map<
    string,
    () => (file: File, propertyId: string) => void
  >();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  enumSubmitFunctions: Map<string, () => ((data: any) => void) | undefined> = new Map<
    string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => (data: any) => void
  >();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  enumSaveFunctions: Map<string, () => ((data: any) => void) | undefined> = new Map<
    string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => (data: any) => void
  >();

  baseEnumerator: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Map<string, () => Record<string, any>>;
    functions: Map<string, () => ((file: File, propertyId: string) => void) | undefined>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    submitFunction: Map<string, () => ((data: any) => void) | undefined>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    saveFunction: Map<string, () => ((data: any) => void) | undefined>;
    addFormContextData: (key: string, data: Record<string, unknown> | unknown[]) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getFormContextData: (key: string) => Record<string, any> | undefined;
    getAllFormContextData: () => AllData;
    isFormSubmitted?: boolean;
    formUrl: string | null | undefined;
  };

  addFormContextData = (key: string, data: Record<string, unknown> | unknown[]) => {
    this.enumValues.set(key, () => data);
  };

  async addDataByUrl(key: string, url: string, processDataFunction: (data: object) => string[], token?: string) {
    let header = {} as AxiosRequestConfig<unknown>;
    const [requestId, axiosWithConfig] = this.getAxiosInterceptorConfig(axios);

    if (token) {
      header = { ...header, ...{ Authorization: `Bearer ${token}` } };
    }

    await axiosWithConfig
      .get(url, header)
      .then((response) => {
        const processedData = processDataFunction(response.data);
        this.enumValues.set(key, () => processedData);
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

  constructor() {
    this.baseEnumerator = {
      data: this.enumValues,
      functions: this.enumFunctions,
      submitFunction: this.enumSubmitFunctions,
      saveFunction: this.enumSaveFunctions,
      addFormContextData: this.addFormContextData,
      getFormContextData: this.getFormContextData,
      getAllFormContextData: this.getAllFormContextData,
      formUrl: this.getFormUrl(),
    };

    this.selfProps = {};
  }

  setup = (props: Props) => {
    this.selfProps = props;
    if (props.fileManagement) {
      const { fileList, uploadFile, downloadFile, deleteFile } = props.fileManagement;

      this.enumValues.set('file-list', () => fileList);

      this.enumFunctions.set('upload-file', () => uploadFile);
      this.enumFunctions.set('download-file', () => downloadFile);
      this.enumFunctions.set('delete-file', () => deleteFile);
    }

    if (props.submit) {
      const { submitForm, saveForm } = props.submit;

      const submitFunction = submitForm;
      const saveFormFunction = saveForm;

      this.enumSubmitFunctions.set('submit-form', () => submitFunction);
      this.enumSaveFunctions.set('save-form', () => saveFormFunction);
    }

    if (props.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Object.keys(props.data).forEach((item: any) => {
        this.enumValues.set(item, () => props.data[item]);
      });
    }

    if (!props.children) {
      return null;
    }
    if (props.formUrl) {
      this.baseEnumerator.formUrl = props.formUrl;
    }
    this.baseEnumerator.isFormSubmitted = props.isFormSubmitted ?? false;
    return <JsonFormContext.Provider value={this.baseEnumerator}>{this.selfProps?.children}</JsonFormContext.Provider>;
  };

  getContextProvider = () => {
    return <JsonFormContext.Provider value={this.baseEnumerator}>{this.selfProps?.children}</JsonFormContext.Provider>;
  };
  getFormUrl = () => {
    return this.selfProps?.formUrl;
  };
  getAxiosInterceptorConfig = (axios: AxiosStatic): [number, AxiosStatic] => {
    const requestId = axios.interceptors.request.use((req) => {
      if (req.data === undefined) {
        throw new Error(`The URL: ${req.url} encountered a CORS error.`);
      }
      return req;
    });

    return [requestId, axios];
  };
  /**
   * Grabs data stored under a given key
   *
   */
  getFormContextData = (key: string) => {
    const dataFunction = this.baseEnumerator.data.get(key);
    return dataFunction && dataFunction();
  };

  /**
   * Grabs all data
   *
   */
  getAllFormContextData = () => {
    const allData: AllData = [];
    this.baseEnumerator.data.forEach((d, key) => {
      allData.push({ [key]: d() });
    });
    return allData;
  };
  /**
   * Allows additional data to be added under a given key
   *
   * This data will then be available inside the context
   */
}

export const ContextProviderC = new ContextProviderClass();
export const ContextProviderFactory = () => new ContextProviderClass().setup;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const JsonFormContext = createContext<any>(null);
