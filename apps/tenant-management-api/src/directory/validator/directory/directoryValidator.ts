import { IsFQDN, ValidateNested, IsDefined, MinLength, MaxLength, IsOptional, IsUrl } from 'class-validator';

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
  @IsDefined()
  @MinLength(3)
  @IsFQDN()
  host: string;
}

export class ServiceV2 {
  @IsDefined()
  @MaxLength(50)
  service: string;

  @MaxLength(50)
  @IsOptional()
  api: string;

  @IsDefined()
  @MaxLength(1024)
  @IsUrl()
  url: string;
}
