export interface Room {
  id: string;
  name: string;
  description: string;
}

export enum ChatServiceRoles {
  Chatter = 'chatter',
  Admin = 'chat-admin',
}
