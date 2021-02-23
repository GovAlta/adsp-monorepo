import { Length, IsFQDN}from 'class-validator';

export class DirectoryValidator{
  @Length(3-100)
  service:string;

  @IsFQDN()
  @Length(10-150)
  host:string;
}