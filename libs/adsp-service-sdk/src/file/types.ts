export interface Rule {
  createdAt: string;
  active: true;
}

export interface Retention extends Rule {
  deleteInDays: number;
}

export interface FileTypeRules {
  retention?: Retention;
}
export interface FileType {
  id: string;
  name: string;
  anonymousRead: boolean;
  readRoles: string[];
  updateRoles: string[];
  rules?: FileTypeRules;
}
