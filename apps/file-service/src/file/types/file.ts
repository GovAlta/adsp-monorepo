export interface UserInfo {
  id: string;
  name: string;
}

export interface File {
  id: string;
  recordId: string;
  filename: string;
  size: number;
  storage: string;
  createdBy: UserInfo;
  created: Date;
  lastAccessed?: Date;
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
