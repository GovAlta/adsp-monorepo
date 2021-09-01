export interface Schema {
  name: string;
  displayName: string;
  port: string;
}

export interface NormalizedSchema {
  displayName: string;
  projectName: string;
  projectRoot: string;
  api: string;
  port: number;
}
