import { IsEmail, IsString, IsEnum, IsOptional, MinLength, IsMobilePhone } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsMobilePhone('en-IN')
  mobile: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  @MinLength(8)
  password: string;
}
