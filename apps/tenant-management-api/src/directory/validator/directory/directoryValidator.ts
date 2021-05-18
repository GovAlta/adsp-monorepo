import { IsFQDN, ValidateNested, IsDefined, MinLength } from 'class-validator';

export class Directory {
  @IsDefined()
  @MinLength(4)
  name: string;

  @ValidateNested()
  services: Service[];
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
