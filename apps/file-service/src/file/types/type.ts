export interface FileType {
  id: string;
  name: string;
  anonymousRead: boolean;
  readRoles: string[];
  updateRoles: string[];
}
