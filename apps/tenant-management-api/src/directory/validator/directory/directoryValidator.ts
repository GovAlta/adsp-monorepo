import { IsFQDN, ValidateNested, IsDefined, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';

export class Directory {
  @IsDefined()
  @MinLength(4)
  name: string;

  @ValidateNested()
  services: Service[];
}
export class Service {
  @MaxLength(50)
  @IsDefined()
  @MinLength(3)
  service: string;

  @MaxLength(50)
  api: string;

  @MaxLength(1024)
  @IsFQDN()
  @IsDefined()
  @MinLength(3)
  host: string;
}

export class ServiceV2 {
  @IsDefined()
  @Matches(/^[a-z0-9_.]/gs)
  @MaxLength(50)
  service: string;

  @Matches(/^[a-z0-9_.]/gs)
  @MaxLength(50)
  @IsOptional()
  api: string;

  @IsDefined()
  @MaxLength(1024)
  @IsFQDN()
  url: string;
}
