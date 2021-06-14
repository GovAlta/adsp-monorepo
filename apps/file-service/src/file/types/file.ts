export interface UserInfo {
  id: string;
  name: string;
}

export interface File {
  id: string;
  recordId: string;
  filename: string;
  size: number;
  createdBy: UserInfo;
  created: Date;
  lastAccessed?: Date;
}

export interface FileRecord extends File {
  storage: string;
  deleted: boolean;
  scanned: boolean;
}

export interface FileCriteria {
  filenameContains?: string;
  scanned?: boolean;
  deleted?: boolean;
  spaceEquals?: string;
  typeEquals?: string;
}

export type NewFile = {
  recordId: string;
  filename: string;
  size: number;
};
