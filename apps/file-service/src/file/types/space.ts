import { FileType } from './type';

export interface FileSpace {
  id: string
  name: string
  spaceAdminRole: string
  types: {
    [id: string]: FileType
  }
}
