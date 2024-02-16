export interface WithInputProps {
  label?: string;
}
export interface WithRequiredProps {
  required?: boolean;
}

export interface KeyPressPathPair {
  keyPressCode: string;
  path: string;
}

export interface WithKeyPressInput {
  keyPressCode?: KeyPressPathPair;
}
