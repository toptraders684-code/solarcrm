import { IsString, IsArray, IsOptional, IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';

const emptyToUndefined = () => Transform(({ value }) => (value === '' ? undefined : value));

export class CreateVendorDto {
  @IsString()
  businessName: string;

  @IsOptional() @IsString()
  contactPerson?: string;

  @IsArray()
  @IsString({ each: true })
  vendorTypes: string[];

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
