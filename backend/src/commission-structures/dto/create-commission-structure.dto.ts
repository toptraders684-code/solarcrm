import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray, IsBoolean } from 'class-validator';

export enum CommissionStructureType {
  per_kw = 'per_kw',
  percentage = 'percentage',
  fixed_per_project = 'fixed_per_project',
  slab_based = 'slab_based',
}

export class CreateCommissionStructureDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(CommissionStructureType)
  structureType: CommissionStructureType;

  @IsArray()
  configSchema: object[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
