import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  identifier: string; // email or mobile number

  @IsString()
  @MinLength(6)
  password: string;
}
