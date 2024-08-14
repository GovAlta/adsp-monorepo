import { ResourceTypeConfiguration } from '../types';

export type DirectoryConfigurationValue = Record<string, { resourceTypes: ResourceTypeConfiguration[] }>;
