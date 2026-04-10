import { IsString, IsArray, IsEnum, IsOptional, IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';
import { VendorType } from '@prisma/client';

// Convert empty strings to undefined so @IsOptional() skips validation
const emptyToUndefined = () => Transform(({ value }) => (value === '' ? undefined : value));

export class CreateVendorDto {
  @IsString()
  businessName: string;

  @IsOptional() @IsString()
  contactPerson?: string;

  @IsArray()
  @IsEnum(VendorType, { each: true })
  vendorTypes: VendorType[];

  @IsOptional() @IsString()
  mobile?: string;

  @IsOptional()
  @emptyToUndefined()
  @IsEmail()
  email?: string;

  @IsOptional() @IsString()
  addressVillage?: string;

  @IsOptional() @IsString()
  addressDistrict?: string;

  @IsOptional() @IsString()
  addressState?: string;

  @IsOptional() @IsString()
  gstin?: string;

  @IsOptional() @IsString()
  ifscCode?: string;

  @IsOptional() @IsString()
  empanelmentDate?: string;
}
