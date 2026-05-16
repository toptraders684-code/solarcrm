import { IsEmail, IsString, IsEnum, IsOptional, MinLength, Matches } from 'class-validator';

export type VendorLevel = 'H1' | 'H2' | 'H3';

export class CreateVendorUserDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @Matches(/^\d{10}$/, { message: 'Mobile must be a 10-digit number' })
  mobile: string;

  @IsEnum(['H1', 'H2', 'H3'])
  vendorLevel: VendorLevel;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @IsString()
  parentVendorUserId?: string;
}
