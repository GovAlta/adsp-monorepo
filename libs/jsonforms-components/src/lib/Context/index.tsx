import { createContext } from 'react';

interface enumerators {
  data: Map<string, () => any>;
  functions: Map<string, () => (file: File, propertyId: string) => void>;
}

export interface AllData {
  [x: string]: any;
}

export class Context {
  fileList: any;
  uploadFile: (file: File, propertyId: string) => void;
  downloadFile: (file: any) => void;
  enumFunctions: Map<string, () => (file: File, propertyId: string) => void>;
  enumValues: Map<string, () => Record<string, any>>;
  baseEnumerator: enumerators;
  jsonFormContext: React.Context<enumerators>;

  empty(): void {
    console.log('do nothing');
  }

  constructor() {
    this.fileList = null;
    /* eslint-disable @typescript-eslint/no-empty-function */
    this.uploadFile = () => {};
    this.downloadFile = () => {};
    /* eslint-enable @typescript-eslint/no-empty-function */

    this.enumFunctions = new Map<string, () => (file: File, propertyId: string) => void>();
    this.enumValues = new Map<string, () => Record<string, any>>();

    this.baseEnumerator = {
      data: this.enumValues,
      functions: this.enumFunctions,
    };

    this.jsonFormContext = createContext(this.baseEnumerator);
  }

  setFileManagement(
    fileList: any,
    uploadFile: (file: File, propertyId: string) => void,
    downloadFile: (file: any) => void
  ): void {
    this.fileList = fileList;
    this.uploadFile = uploadFile;
    this.downloadFile = downloadFile;

    this.enumValues.set('file-list', () => this.fileList);
    this.enumFunctions.set('upload-file', () => this.uploadFile);
    this.enumFunctions.set('download-file', () => this.downloadFile);
  }

  /**
   * Allows additional data to be added under a given key
   *
   * This data will then be available inside the context
   */
  addData(key: string, data: Record<string, string> | string[]) {
    this.enumValues.set(key, () => data);
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
