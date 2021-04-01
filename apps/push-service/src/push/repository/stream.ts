import { Repository } from '@core-services/core-common';
import { StreamEntity } from '../model';
import { Stream } from '../types';

export type StreamRepository = Repository<StreamEntity, Stream, { spaceId: string; id: string }>;
