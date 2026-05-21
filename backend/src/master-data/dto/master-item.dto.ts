import { IsString, IsOptional, IsBoolean, IsInt, IsNumber, Min } from 'class-validator';

export class CreateMasterItemDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  fullform?: string;

  @IsOptional()
  @IsString()
  headquarters?: string;
}

export class CreateStageDto {
  @IsInt()
  @Min(1)
  stageNumber: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateMasterItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  fullform?: string;

  @IsOptional()
  @IsString()
  headquarters?: string;
}

export class UpdateStageDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
