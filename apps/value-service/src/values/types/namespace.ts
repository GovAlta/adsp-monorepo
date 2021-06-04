import { ValueDefinition } from './valueDefinition';

export interface Namespace {
  name: string;
  description: string;
  definitions: {
    [name: string]: ValueDefinition;
  };
}
