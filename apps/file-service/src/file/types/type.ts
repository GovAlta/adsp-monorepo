export interface FileType {
  id: string;
  _id?: string;
  name: string;
  anonymousRead: boolean;
  readRoles: string[];
  updateRoles: string[];
  spaceId?: string;
}

export interface FileTypeCriteria {
  filenameContains?: string;
  scanned?: boolean;
  deleted?: boolean;
  spaceEquals?: string;
  typeEquals?: string;
}
