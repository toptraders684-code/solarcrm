import { IsString, IsOptional, IsEmail, MinLength, Length } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  companyName: string;

  @IsString()
  adminName: string;

  @IsString()
  @Length(10, 10)
  adminMobile: string;

  @IsOptional()
  @IsEmail()
  adminEmail?: string;

  @IsString()
  @MinLength(6)
  adminPassword: string;
}
