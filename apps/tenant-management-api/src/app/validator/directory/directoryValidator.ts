import { IsFQDN, ValidateNested, IsDefined, MinLength } from 'class-validator';
import { Serivce } from '../../types/directory';

export class Directory {
  @IsDefined()
  @MinLength(4)
  name: string;

  @ValidateNested()
  services: Serivce[];
}
export class Service {
  @IsDefined()
  @MinLength(4)
  service: string;

  @IsFQDN()
  @IsDefined()
  @MinLength(4)
  host: string;
}
